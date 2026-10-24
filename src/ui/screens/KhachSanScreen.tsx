"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Star,
  ExternalLink,
  Send,
  SlidersHorizontal,
  Database,
  ArrowUpDown,
} from "lucide-react";
import { SiteHeader } from "@/ui/components/site/SiteHeader";
import { SiteFooter } from "@/ui/components/site/SiteFooter";
import { ChonDiem } from "@/ui/components/ChonDiem";
import { dinhDangTien } from "@/core/formB1";
import type { DiemDen } from "@/contracts";

export interface KhachSanItem {
  id: string;
  ten: string;
  khuVuc?: string;
  soSao: number | null;
  giaDemUocTinh: number;
  mapUrl: string;
  nguon: string;
}

export interface DiemDenLuaChon {
  slug: string;
  ten: string;
  quocGia: string;
  hotels: KhachSanItem[];
}

export interface KhachSanScreenProps {
  danhSachDiemDen: DiemDenLuaChon[];
  initialSlug?: string;
  ngayDuLieu?: string;
}

export function KhachSanScreen({
  danhSachDiemDen,
  initialSlug,
  ngayDuLieu = "20/10/2026",
}: KhachSanScreenProps) {
  // Điểm đến mặc định là điểm đầu tiên hoặc theo initialSlug
  const [selectedSlug, setSelectedSlug] = useState<string>(() => {
    if (initialSlug && danhSachDiemDen.some((d) => d.slug === initialSlug)) {
      return initialSlug;
    }
    return danhSachDiemDen[0]?.slug || "da-nang";
  });

  // Hỗ trợ đồng bộ tham số URL ?diem-den=...
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const querySlug = sp.get("diem-den");
      if (querySlug && danhSachDiemDen.some((d) => d.slug === querySlug)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ với hệ thống bên ngoài React (URL, sessionStorage, mạng) chỉ làm được sau khi dựng
        setSelectedSlug(querySlug);
      }
    }
  }, [danhSachDiemDen]);

  const activeDiemDen = useMemo(() => {
    return (
      danhSachDiemDen.find((d) => d.slug === selectedSlug) ||
      danhSachDiemDen[0]
    );
  }, [danhSachDiemDen, selectedSlug]);

  // Bộ lọc số sao và sắp xếp theo giá
  const [filterSao, setFilterSao] = useState<string>("all");
  const [sapXepGia, setSapXepGia] = useState<"default" | "asc" | "desc">("default");

  // Chuyển đổi danh sách điểm đến sang định dạng ChonDiem
  const optionsChonDiem: DiemDen[] = useMemo(() => {
    return danhSachDiemDen.map((d) => ({
      ten: d.ten,
      quocGia: d.quocGia,
      maQuocGia: d.slug === "bangkok" ? "TH" : d.slug === "seoul" ? "KR" : "VN",
      toaDo: { lat: 0, lng: 0 },
      tienTe: d.slug === "bangkok" ? "THB" : d.slug === "seoul" ? "KRW" : "VND",
      nguon: "danh_sach_co_dinh" as const,
      ngayLay: new Date().toISOString(),
    }));
  }, [danhSachDiemDen]);

  const currentDiemDenValue = useMemo<DiemDen | null>(() => {
    if (!activeDiemDen) return null;
    return (
      optionsChonDiem.find((opt) => opt.ten === activeDiemDen.ten) || null
    );
  }, [activeDiemDen, optionsChonDiem]);

  const handleChonDiem = (val: DiemDen | null) => {
    if (!val) return;
    const found = danhSachDiemDen.find((d) => d.ten === val.ten);
    if (found) {
      setSelectedSlug(found.slug);
    }
  };

  // Lọc và sắp xếp danh sách khách sạn
  const filteredAndSortedHotels = useMemo(() => {
    if (!activeDiemDen) return [];
    let list = [...activeDiemDen.hotels];

    // Lọc theo số sao
    if (filterSao === "5") {
      list = list.filter((h) => h.soSao === 5);
    } else if (filterSao === "4") {
      list = list.filter((h) => h.soSao === 4);
    } else if (filterSao === "3") {
      list = list.filter((h) => h.soSao === 3);
    } else if (filterSao === "unrated") {
      list = list.filter((h) => !h.soSao || h.soSao === 0);
    }

    // Sắp xếp theo giá
    if (sapXepGia === "asc") {
      list.sort((a, b) => a.giaDemUocTinh - b.giaDemUocTinh);
    } else if (sapXepGia === "desc") {
      list.sort((a, b) => b.giaDemUocTinh - a.giaDemUocTinh);
    }

    return list;
  }, [activeDiemDen, filterSao, sapXepGia]);

  const lapKeHoachUrl = activeDiemDen
    ? `/lap-ke-hoach?den=${encodeURIComponent(activeDiemDen.ten)}`
    : "/lap-ke-hoach";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-background)",
        color: "var(--color-text)",
        fontSize: 16,
      }}
    >
      <SiteHeader />

      <main id="main-content" style={{ flex: 1 }}>
        {/* Banner Tiêu đề & Chọn điểm đến */}
        <section
          style={{
            background: "linear-gradient(180deg, var(--color-surface) 0%, var(--color-background) 100%)",
            padding: "48px 24px 36px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* Breadcrumb */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-primary-main)",
                marginBottom: 16,
              }}
            >
              <Link href="/" style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
                Trang chủ
              </Link>
              <span>/</span>
              <span style={{ color: "var(--color-primary-main)" }}>Khách sạn</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                flexWrap: "wrap",
                gap: 24,
                marginBottom: 28,
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: "clamp(32px, 4vw, 44px)",
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: "var(--color-text)",
                    marginBottom: 10,
                  }}
                >
                  Danh sách khách sạn tham khảo
                </h1>
                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: "var(--color-text-sub)",
                    margin: 0,
                    maxWidth: 720,
                  }}
                >
                  Tra cứu nơi lưu trú với mức giá ước tính danh nghĩa bám sát thực tế từ snapshot dữ liệu kiểm toán.
                </p>
              </div>

              {activeDiemDen && (
                <Link
                  href={lapKeHoachUrl}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    height: 44,
                    padding: "0 22px",
                    borderRadius: "var(--r-md)",
                    background: "var(--color-primary-main)",
                    color: "var(--color-primary-text)",
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(43, 85, 214, 0.2)",
                  }}
                >
                  <Send size={16} />
                  <span>Lập kế hoạch đi {activeDiemDen.ten}</span>
                </Link>
              )}
            </div>

            {/* Thanh điều khiển: Chọn điểm đến qua ChonDiem + Lọc số sao + Sắp xếp giá */}
            <div
              style={{
                background: "var(--color-surface)",
                borderRadius: "var(--r-xl)",
                border: "1px solid var(--color-border)",
                padding: "20px 24px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 20,
                alignItems: "flex-end",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.03)",
              }}
            >
              {/* Chọn điểm đến bằng ChonDiem */}
              <div>
                <ChonDiem
                  id="chon-diem-khach-san"
                  label="Điểm đến"
                  placeholder="Chọn điểm đến để xem khách sạn..."
                  value={currentDiemDenValue}
                  onChange={handleChonDiem}
                  options={optionsChonDiem}
                />
              </div>

              {/* Lọc theo số sao */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  htmlFor="filter-so-sao"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    color: "var(--color-text)",
                  }}
                >
                  <SlidersHorizontal size={15} color="var(--color-primary-main)" />
                  <span>Xếp hạng số sao</span>
                </label>
                <select
                  id="filter-so-sao"
                  value={filterSao}
                  onChange={(e) => setFilterSao(e.target.value)}
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 12px",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    fontSize: "var(--font-size-base)",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="all">Tất cả số sao</option>
                  <option value="5">5 sao</option>
                  <option value="4">4 sao</option>
                  <option value="3">3 sao</option>
                  <option value="unrated">Chưa xếp hạng</option>
                </select>
              </div>

              {/* Sắp xếp theo giá */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  htmlFor="sort-gia"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    color: "var(--color-text)",
                  }}
                >
                  <ArrowUpDown size={15} color="var(--color-primary-main)" />
                  <span>Sắp xếp theo giá</span>
                </label>
                <select
                  id="sort-gia"
                  value={sapXepGia}
                  onChange={(e) => setSapXepGia(e.target.value as any)}
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 12px",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    fontSize: "var(--font-size-base)",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="default">Mặc định</option>
                  <option value="asc">Giá tăng dần (thấp đến cao)</option>
                  <option value="desc">Giá giảm dần (cao đến thấp)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Lưới danh sách khách sạn */}
        <section
          style={{
            maxWidth: 1200,
            margin: "40px auto 56px",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={20} color="var(--color-primary-main)" />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
                Khách sạn tại {activeDiemDen?.ten}
              </h2>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-text-sub)",
                  background: "var(--color-surface-sub)",
                  padding: "2px 8px",
                  borderRadius: "var(--r-full)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {filteredAndSortedHotels.length} kết quả
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-sub)" }}>
              Cập nhật dữ liệu ngày {ngayDuLieu}
            </div>
          </div>

          {/* Nếu không có khách sạn nào khớp bộ lọc */}
          {filteredAndSortedHotels.length === 0 ? (
            <div
              style={{
                background: "var(--color-surface)",
                borderRadius: "var(--r-xl)",
                border: "1px solid var(--color-border)",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "var(--r-full)",
                  background: "var(--color-surface-sub)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  color: "var(--color-text-sub)",
                }}
              >
                <Building2 size={28} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
                Không tìm thấy khách sạn phù hợp
              </h3>
              <p style={{ fontSize: 14, color: "var(--color-text-sub)", marginBottom: 20 }}>
                Hiện không có khách sạn nào tại {activeDiemDen?.ten} khớp với bộ lọc số sao này.
              </p>
              <button
                type="button"
                onClick={() => setFilterSao("all")}
                style={{
                  height: 40,
                  padding: "0 20px",
                  borderRadius: "var(--r-md)",
                  border: "none",
                  background: "var(--color-primary-main)",
                  color: "var(--color-primary-text)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Xem tất cả khách sạn
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {filteredAndSortedHotels.map((ks) => (
                <article
                  key={ks.id}
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "var(--r-xl)",
                    border: "1px solid var(--color-border)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div>
                    {/* Khung ảnh có nền thay thế như H5 */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "16 / 10",
                        background: "linear-gradient(135deg, var(--color-primary-tint) 0%, var(--color-surface-sub) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "var(--r-full)",
                          background: "var(--color-surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
                        }}
                      >
                        <Building2 size={24} color="var(--color-primary-main)" />
                      </div>

                      {/* Huy hiệu điểm đến */}
                      <div
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--color-primary-main)",
                          background: "var(--color-surface)",
                          padding: "3px 8px",
                          borderRadius: "var(--r-full)",
                          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
                        }}
                      >
                        <MapPin size={11} />
                        <span>{activeDiemDen?.ten}</span>
                      </div>
                    </div>

                    {/* Nội dung thông tin khách sạn */}
                    <div style={{ padding: "18px 20px 12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--color-text-sub)",
                            fontWeight: 600,
                          }}
                        >
                          {ks.khuVuc || "Trung tâm"}
                        </span>

                        {ks.soSao && ks.soSao > 0 ? (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--color-hangMuc-anUong)",
                            }}
                          >
                            <Star size={13} fill="currentColor" />
                            <span>{ks.soSao} sao</span>
                          </div>
                        ) : null}
                      </div>

                      <h3
                        style={{
                          fontSize: 17,
                          fontWeight: 800,
                          color: "var(--color-text)",
                          marginBottom: 12,
                          lineHeight: 1.35,
                        }}
                      >
                        {ks.ten}
                      </h3>

                      {/* Giá mỗi đêm kèm nhãn ước tính */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 6,
                          marginBottom: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 19,
                            fontWeight: 800,
                            color: "var(--color-primary-main)",
                          }}
                        >
                          {dinhDangTien(ks.giaDemUocTinh)} đ
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--color-text-sub)",
                          }}
                        >
                          / đêm (ước tính)
                        </span>
                      </div>

                      {/* Nhãn nguồn OpenStreetMap */}
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--color-text-sub)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Database size={12} color="var(--color-text-sub)" />
                        <span>Nguồn: OpenStreetMap contributors</span>
                      </div>
                    </div>
                  </div>

                  {/* Nút Xem trên Google Maps */}
                  <div style={{ padding: "14px 20px 18px" }}>
                    <a
                      href={ks.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        width: "100%",
                        height: 38,
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface-sub)",
                        color: "var(--color-primary-main)",
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>Xem trên Google Maps</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Dải minh bạch dữ liệu */}
        <section
          style={{
            maxWidth: 1200,
            margin: "0 auto 24px",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--r-lg)",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 15,
              color: "var(--color-text-sub)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Database size={18} color="var(--color-primary-main)" />
              <span>Dữ liệu: OpenStreetMap contributors. Giá là ước tính.</span>
            </div>
            <Link
              href="/lap-ke-hoach"
              style={{
                color: "var(--color-primary-main)",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: 15,
              }}
            >
              Lên lịch trình chuyến đi →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter ngayDuLieu={ngayDuLieu} />
    </div>
  );
}
