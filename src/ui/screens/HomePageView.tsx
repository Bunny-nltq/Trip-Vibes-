"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/ui/components/site/SiteFooter";
import { HomeLanding } from "@/ui/components/site/HomeLanding";
import { ThuDiemDen, type DiemDenThe } from "@/ui/components/site/ThuDiemDen";
import { KhachSanThamKhao, type KhachSanThe } from "@/ui/components/site/KhachSanThamKhao";
import { VenueHighlights } from "./VenueHighlights";
import { useHotelHighlights } from "@/ui/hooks/useHotelHighlights";
import { publicTheme } from "@/ui/components/site/publicTheme";
import styles from "@/ui/components/site/Public.module.css";
export interface HomePageViewProps {
    diemDens: DiemDenThe[];
    khachSans?: KhachSanThe[];
    ngayDuLieu?: string;
}
export function HomePageView({ diemDens:allDestinations, khachSans:allHotels = [], ngayDuLieu }: HomePageViewProps) { const diemDens=allDestinations.filter(d=>!["bangkok","seoul"].includes(d.id));const khachSans=allHotels.filter(h=>!["bangkok","seoul"].includes(h.diemDenSlug)); const highlights = useHotelHighlights(khachSans.map(hotel => hotel.diemDenTen)); return <div className={styles.page} style={publicTheme}><main id="main-content"><HomeLanding diemDens={diemDens}/><section className={styles.section} id="diem-den"><div className={styles.heading}><div><span className={styles.eyebrow}>ĐI TÌM MỘT CHÂN TRỜI MỚI</span><h2>Bạn muốn thức dậy ở đâu?</h2><p className={styles.muted}>Biển xanh, phố cổ hay thành phố không ngủ — chọn nơi khiến bạn háo hức.</p></div><Link className={styles.link} href="/diem-den">Tất cả điểm đến<ArrowRight size={16}/></Link></div><ThuDiemDen diemDens={diemDens}/></section><VenueHighlights />{khachSans.length > 0 && <section className={styles.section} id="khach-san"><div className={styles.heading}><div><span className={styles.eyebrow}>MỘT CHỖ DỪNG CHÂN THẬT DỄ CHỊU</span><h2>Nghỉ ngơi để tiếp tục khám phá</h2><p className={styles.muted}>So sánh khu vực, tiện ích và giá dự kiến. Ảnh minh họa; hãy xác nhận thông tin khi chọn nơi lưu trú.</p></div><Link className={styles.link} href="/khach-san">Khám phá nơi lưu trú<ArrowRight size={16}/></Link></div><KhachSanThamKhao khachSans={khachSans} highlights={highlights}/></section>}<section className={styles.section}><div className={styles.callout}><div><span className={styles.eyebrow}>HÀNH TRÌNH ĐẸP BẮT ĐẦU TỪ MỘT Ý TƯỞNG</span><h2>Chuyến đi tiếp theo, bạn muốn đi đâu?</h2><p>Chọn điểm đến và để những điều thú vị dần hiện ra.</p></div><Link className={`${styles.button} ${styles.primary}`} href="/lap-ke-hoach">Bắt đầu lên kế hoạch<ArrowRight size={18}/></Link></div></section></main><SiteFooter ngayDuLieu={ngayDuLieu}/></div>; }
