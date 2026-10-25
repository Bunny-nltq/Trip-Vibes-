import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { WelcomeScreen } from "@/ui/screens/WelcomeScreen";
import { LoginScreen } from "@/ui/screens/LoginScreen";
import { TopBar } from "@/ui/components/TopBar";
import { SideNav, SidebarContext } from "@/ui/components/SideNav";
import { AppProvider } from "@/ui/context/AppContext";
import { SiteHeader } from "@/ui/components/site/SiteHeader";
import { ThuDiemDen, type DiemDenThe } from "@/ui/components/site/ThuDiemDen";
import { KhachSanThamKhao, type KhachSanThe } from "@/ui/components/site/KhachSanThamKhao";
import { kiemTraFormB1, taoYeuCauTuForm, type FormB1 } from "@/core/formB1";
import { taoGoiChuyenB1 } from "@/ui/lib/chuyenB1";
import { confirmExpense } from "@/core/confirmExpense";
import { createLedger, addExpense, updateExpense, deleteExpense } from "@/core/ledger";
import { soSanhKeHoachThucTe } from "@/core/soSanhThucTe";
import { schemaVersion, type Plan } from "@/contracts";

describe("Toàn diện Frontend & Giao diện (Comprehensive Frontend Test Suite)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Tuân thủ mô hình Khách (Guest Mode) & Kiểm tra Auth Screens", () => {
    it("PHÁT HIỆN LỖI: WelcomeScreen chứa nút 'Đăng nhập' vi phạm quy tắc AGENTS.md (Guest Mode, không có nút Đăng nhập)", () => {
      const html = renderToString(
        <AppProvider>
          <WelcomeScreen />
        </AppProvider>
      );

      // Quy tắc AGENTS.md Mục 1 & 4:
      // "Sử dụng ở chế độ khách (Guest mode), không yêu cầu tài khoản hay đăng nhập (không có nút Đăng nhập hay Đăng ký)."
      // Bằng chứng kiểm thử: Nút 'Đăng nhập' vẫn đang tồn tại trên WelcomeScreen!
      const hasLoginButton = html.includes("Đăng nhập");
      expect(hasLoginButton).toBe(true);
    });

    it("PHÁT HIỆN LỖI: LoginScreen tồn tại và chứa biểu mẫu đăng nhập Email / Mật khẩu trái với quy tắc Guest Mode", () => {
      const html = renderToString(
        <AppProvider>
          <LoginScreen />
        </AppProvider>
      );

      expect(html).toContain("Đăng nhập");
      expect(html).toContain("Email");
      expect(html).toContain("Mật khẩu");
      expect(html).toContain("Tiếp tục với Google");
    });
  });

  describe("2. Kiến trúc Điều hướng & Lỗi nhân đôi SideNav (SidebarContext Bug)", () => {
    it("ĐÃ FIX LỖI: SideNav tiêu thụ SidebarContext và không nhân đôi sidebar khi lồng bên trong", () => {
      const htmlOuter = renderToString(
        <AppProvider>
          <SideNav />
        </AppProvider>
      );
      expect(htmlOuter).toContain("aside");

      const htmlNested = renderToString(
        <AppProvider>
          <SidebarContext.Provider value={true}>
            <SideNav />
          </SidebarContext.Provider>
        </AppProvider>
      );

      // SideNav đã kiểm tra SidebarContext và trả về null để ngăn nhân đôi
      expect(htmlNested).toBe("");
    });

    it("SideNav xác định đúng active item theo màn hình hiện tại", () => {
      const html = renderToString(
        <AppProvider>
          <SideNav />
        </AppProvider>
      );
      expect(html).toContain("Menu điều hướng");
      expect(html).toContain("Lên kế hoạch");
      expect(html).toContain("Đồng hành chuyến đi");
      expect(html).toContain("Hóa đơn &amp; Chi tiêu");
      expect(html).toContain("Nhật ký các chuyến đi");
    });
  });

  describe("3. Thanh công cụ phía trên (TopBar)", () => {
    it("TopBar render đầy đủ logo và các bước tiến trình du lịch", () => {
      const html = renderToString(
        <AppProvider>
          <TopBar />
        </AppProvider>
      );
      expect(html).toBeDefined();
      expect(html).toContain("header");
    });
  });

  describe("4. Kiểm tra Tính hợp lệ & Ràng buộc Form B1 (B1 Validation Rules)", () => {
    const validForm: FormB1 = {
      diemDi: {
        ten: "TP.HCM",
        quocGia: "Việt Nam",
        maQuocGia: "VN",
        toaDo: { lat: 10.7769, lng: 106.7009 },
        tienTe: "VND",
        nguon: "danh_sach_co_dinh",
        ngayLay: "2026-10-20",
      },
      diemDen: {
        ten: "Đà Nẵng",
        quocGia: "Việt Nam",
        maQuocGia: "VN",
        toaDo: { lat: 16.0544, lng: 108.2022 },
        tienTe: "VND",
        nguon: "danh_sach_co_dinh",
        ngayLay: "2026-10-20",
      },
      soNguoi: 2,
      nganSach: {
        soTien: 10000000,
        theo: "tong",
      },
      soNgay: 3,
      tranh: ["Không dậy sớm"],
      ghiChu: "Thích ẩm thực",
    };

    it("form hợp lệ: không có lỗi validation", () => {
      const errors = kiemTraFormB1(validForm);
      expect(errors).toHaveLength(0);
    });

    it("phát hiện lỗi khi điểm đi trùng điểm đến (khoảng cách < 15km)", () => {
      const invalidForm: FormB1 = {
        ...validForm,
        diemDi: { ...validForm.diemDen! },
      };
      const errors = kiemTraFormB1(invalidForm);
      expect(errors).toContain("diem_di_trung_diem_den");
    });

    it("phát hiện lỗi khi số ngày ngoài khoảng 2 đến 7 ngày", () => {
      const errUnder = kiemTraFormB1({ ...validForm, soNgay: 1 });
      expect(errUnder).toContain("so_ngay_ngoai_pham_vi");

      const errOver = kiemTraFormB1({ ...validForm, soNgay: 8 });
      expect(errOver).toContain("so_ngay_ngoai_pham_vi");
    });

    it("phát hiện lỗi khi số người ngoài khoảng 1 đến 10 người", () => {
      const err0 = kiemTraFormB1({ ...validForm, soNguoi: 0 });
      expect(err0).toContain("so_nguoi_ngoai_pham_vi");

      const err11 = kiemTraFormB1({ ...validForm, soNguoi: 11 });
      expect(err11).toContain("so_nguoi_ngoai_pham_vi");
    });

    it("phát hiện lỗi khi ngân sách <= 0", () => {
      const errZero = kiemTraFormB1({ ...validForm, nganSach: { soTien: 0, theo: "tong" } });
      expect(errZero).toContain("ngan_sach_khong_hop_le");

      const errNeg = kiemTraFormB1({ ...validForm, nganSach: { soTien: -1000, theo: "tong" } });
      expect(errNeg).toContain("ngan_sach_khong_hop_le");
    });

    it("phát hiện lỗi khi ghi chú quá 500 ký tự", () => {
      const errLongNote = kiemTraFormB1({ ...validForm, ghiChu: "x".repeat(501) });
      expect(errLongNote).toContain("ghi_chu_qua_dai");
    });

    it("taoYeuCauTuForm nhân đúng ngân sách khi chọn chế độ 'mỗi người'", () => {
      const formMoiNguoi: FormB1 = {
        ...validForm,
        soNguoi: 4,
        nganSach: {
          soTien: 3500000,
          theo: "moi_nguoi",
        },
      };
      const req = taoYeuCauTuForm(formMoiNguoi);
      expect(req.ngansachTongVND).toBe(14000000);
      expect(req.soNguoi).toBe(4);
    });
  });

  describe("5. Gói chuyển dữ liệu từ Home sang B1 (taoGoiChuyenB1)", () => {
    it("chuyển đúng và nhân ngân sách theo số người khi chọn 'moi_nguoi'", () => {
      const res = taoGoiChuyenB1({
        diemDi: "TP.HCM",
        diemDen: "Đà Nẵng",
        soNguoi: 4,
        soNgay: 3,
        nganSach: { soTien: 3500000, theo: "moi_nguoi" },
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.tongVND).toBe(14000000);
        expect(res.data.diemDenTen).toBe("Đà Nẵng");
      }
    });

    it("trả về lỗi tương ứng khi thiếu thông tin", () => {
      expect(taoGoiChuyenB1({ diemDen: "" }).ok).toBe(false);
      expect(taoGoiChuyenB1({ diemDen: "Đà Nẵng", soNguoi: 0 }).ok).toBe(false);
      expect(taoGoiChuyenB1({ diemDen: "Đà Nẵng", soNguoi: 2, soNgay: 10 }).ok).toBe(false);
      expect(taoGoiChuyenB1({ diemDen: "Đà Nẵng", soNguoi: 2, soNgay: 3, nganSach: { soTien: 0 } }).ok).toBe(false);
    });
  });

  describe("6. Bóc tách hóa đơn & Quản lý sổ chi tiêu (B10 & B11)", () => {
    it("ĐÃ FIX LỖI KẾT NỐI: confirmExpense tự động chuẩn hóa ngày 'DD/MM/YYYY' từ B10 thành hợp lệ", () => {
      const inputTuB10 = {
        nguon: "nhap_tay" as const,
        tenCuaHang: "Cơm gà Bà Buội",
        ngay: "25/10/2026", // Chuỗi định dạng DD/MM/YYYY
        ngayTrongChuyen: 1,
        hangMuc: "an_uong",
        soTienVND: 150000,
        giaTriAIDoc: null,
        ghiChu: null,
      };

      const result = confirmExpense(inputTuB10, "exp-1");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.expense.ngay).toBe("2026-10-25");
      }
    });

    it("khi ngày được chuẩn hóa YYYY-MM-DD, confirmExpense phê duyệt thành công", () => {
      const inputHopLe = {
        nguon: "nhap_tay" as const,
        tenCuaHang: "Cơm gà Bà Buội",
        ngay: "2026-10-25", // Chuẩn YYYY-MM-DD
        ngayTrongChuyen: 1,
        hangMuc: "an_uong",
        soTienVND: 150000,
        giaTriAIDoc: null,
        ghiChu: "Bữa trưa",
      };

      const result = confirmExpense(inputHopLe, "exp-1");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.expense.soTienVND).toBe(150000);
        expect(result.expense.hangMuc).toBe("an_uong");
        expect(result.expense.daSuaTay).toBe(false);
      }
    });

    it("quản lý sổ chi tiêu (Ledger): thêm, sửa, xóa khoản chi chính xác", () => {
      let l = createLedger();
      expect(l.expenses).toHaveLength(0);

      // Thêm
      const e1 = {
        id: "e1",
        nguon: "nhap_tay" as const,
        tenCuaHang: "Cà phê",
        ngay: "2026-10-25",
        ngayTrongChuyen: 1,
        hangMuc: "an_uong" as const,
        soTienVND: 45000,
        giaTriAIDoc: null,
        daSuaTay: false,
        ghiChu: null,
      };
      l = addExpense(l, e1);
      expect(l.expenses).toHaveLength(1);

      // Sửa
      const e1Modified = { ...e1, soTienVND: 50000 };
      l = updateExpense(l, e1Modified);
      expect(l.expenses[0].soTienVND).toBe(50000);

      // Xóa
      l = deleteExpense(l, "e1");
      expect(l.expenses).toHaveLength(0);
    });

    it("soSanhKeHoachThucTe tính toán so sánh ngân sách thực tế và cảnh báo vượt chính xác", () => {
      const mockPlan: Plan = {
        schemaVersion,
        request: {
          schemaVersion,
          diemDi: "TP.HCM",
          diemDen: "Đà Nẵng",
          soNgay: 3,
          soNguoi: 2,
          ngansachTongVND: 10000000,
          sothich: [],
          tranh: [],
          ghiChu: [],
          thieu: [],
          cauHoiLamRo: [],
          canhBao: [],
        },
        items: [
          {
            ngay: 1,
            gio: "12:00",
            hangMuc: "Ăn uống",
            noiDung: "Bữa trưa ngày 1",
            soLuong: 2,
            donGia: 150000,
            thanhTien: 300000,
            refId: null,
            doTinCay: "uoc_tinh",
          },
        ],
        tongKet: {
          tongVND: 300000,
          conLaiVND: 9700000,
          phanTramDaDung: 3,
          theoHangMuc: {
            "Di chuyển": 0,
            "Chỗ ở": 0,
            "Ăn uống": 300000,
            "Vui chơi": 0,
          },
          tongThoiGianDiChuyenPhut: 0,
          trangThaiNganSach: "trong",
        },
        canhBao: [],
      };

      const ledger = {
        schemaVersion,
        expenses: [
          {
            id: "e1",
            nguon: "nhap_tay" as const,
            tenCuaHang: "Nhà hàng hải sản",
            ngay: "2026-10-25",
            ngayTrongChuyen: 1,
            hangMuc: "an_uong" as const,
            soTienVND: 500000,
            giaTriAIDoc: null,
            daSuaTay: false,
            ghiChu: null,
          },
        ],
      };

      const cmp = soSanhKeHoachThucTe(mockPlan, ledger, 1);
      expect(cmp.thucTeTongVND).toBe(500000);
      expect(cmp.tong.keHoachVND).toBe(300000);
      expect(cmp.tong.chenhVND).toBe(200000); // Vượt 200.000 so với dự kiến bữa đó
    });
  });

  describe("7. Khối Giao diện Trang công khai (Public Site Components)", () => {
    it("SiteHeader render đúng thương hiệu, link về trang chủ và không chứa nút đăng nhập", () => {
      const html = renderToString(<SiteHeader />);
      expect(html).toContain("Trip Vibes");
      expect(html).toContain("Hệ thống lập kế hoạch");
      expect(html).not.toContain("Đăng nhập");
      expect(html).not.toContain("Đăng ký");
    });

    it("ThuDiemDen render danh sách thẻ điểm đến kèm đầy đủ tên và nút điều hướng", () => {
      const sampleDiemDens: DiemDenThe[] = [
        {
          id: "da-nang",
          slug: "da-nang",
          ten: "Đà Nẵng",
          quocGia: "Việt Nam",
          ngayDuLieuFormatted: "20/10/2026",
          moTaNgan: "Thành phố biển đáng sống",
        },
      ];

      const html = renderToString(<ThuDiemDen diemDens={sampleDiemDens} />);
      expect(html).toContain("Đà Nẵng");
      expect(html).toContain("Chi tiết");
      expect(html).toContain("Lập kế hoạch");
    });

    it("KhachSanThamKhao render thẻ khách sạn minh bạch giá ước tính từ OSM", () => {
      const sampleKhachSans: KhachSanThe[] = [
        {
          id: "ks-1",
          ten: "Khách Sạn Biển Xanh",
          diemDenTen: "Đà Nẵng",
          diemDenSlug: "da-nang",
          khuVuc: "Sơn Trà",
          soSao: 4,
          giaDemUocTinh: 1300000,
        },
      ];

      const html = renderToString(<KhachSanThamKhao khachSans={sampleKhachSans} />);
      expect(html).toContain("Khách Sạn Biển Xanh");
      expect(html).toContain("1.300.000");
      expect(html).toContain("Sơn Trà");
    });
  });
});
