"use client";
import Link from "next/link";
import { MapPin, ArrowUpRight, Star } from "lucide-react";
import type { HotelHighlight } from "@/ui/hooks/useHotelHighlights";
import { HotelFacts } from "./HotelFacts";
import styles from "./Public.module.css";
export interface KhachSanThe {
    id: string;
    ten: string;
    diemDenTen: string;
    diemDenSlug: string;
    khuVuc: string;
    soSao: number | null;
    giaDemUocTinh: number;
}
export interface KhachSanThamKhaoProps {
    khachSans: KhachSanThe[];
    highlights?: Record<string, HotelHighlight>;
}
export function KhachSanThamKhao({ khachSans, highlights = {} }: KhachSanThamKhaoProps) { return <div className={styles.grid}>{khachSans.map(hotel => { const details = highlights[hotel.id]; return <article key={hotel.id} className={styles.card}><div className={`${styles.photo} ${styles.sampleLodging}`}><span className={styles.sampleLabel}>Ảnh minh họa phòng</span></div><div className={styles.body}><span className={styles.tag}><MapPin size={14}/>{hotel.diemDenTen} · {hotel.khuVuc || "Xem vị trí trên bản đồ"}</span><h3>{hotel.ten}</h3>{hotel.soSao !== null && <span className={styles.tag}><Star size={14}/>Hạng {hotel.soSao} sao theo nguồn</span>}<HotelFacts details={details}/><p className={styles.price}>{hotel.giaDemUocTinh.toLocaleString("vi-VN")} đ<small className={styles.muted}> / phòng / đêm · ước tính</small></p><div className={styles.actions}><a className={styles.link} target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.ten}, ${hotel.diemDenTen}`)}`}>Chỉ đường<ArrowUpRight size={16}/></a><Link className={styles.link} href={`/khach-san?diem-den=${hotel.diemDenSlug}`}>Xem lựa chọn lưu trú<ArrowUpRight size={16}/></Link></div></div></article>; })}</div>; }
