"use client";
import Link from "next/link";
import { Mountain, ArrowUpRight } from "lucide-react";
import { publicTheme } from "./publicTheme";
import styles from "./Public.module.css";
export interface SiteFooterProps {
    ngayDuLieu?: string;
    onOpenGioiHan?: () => void;
}
export function SiteFooter(_props: SiteFooterProps) { return <footer className={styles.footer} style={publicTheme}><div className={styles.footerGrid}><div><Link href="/" className={styles.brand}><Mountain size={32}/><strong>Trip Vibes</strong></Link><p className={styles.muted}>Đi xa hơn, tận hưởng nhiều hơn.<br />Khám phá điểm đến và tạo hành trình theo cách của bạn.</p><Link href="/lap-ke-hoach" className={styles.link}>Bắt đầu hành trình<ArrowUpRight size={16}/></Link></div><div><h3>Khám phá</h3><ul><li><Link href="/diem-den">Trải nghiệm</Link></li><li><Link href="/khach-san">Nơi lưu trú</Link></li><li><Link href="/#kham-pha">Ăn uống & cà phê</Link></li><li><Link href="/lich-trinh">Cảm hứng lịch trình</Link></li></ul></div><div><h3>Hành trình của bạn</h3><ul><li><Link href="/lap-ke-hoach">Lên kế hoạch</Link></li><li><Link href="/lap-ke-hoach?screen=saved-trips">Nhật ký chuyến đi</Link></li><li><Link href="/lap-ke-hoach?screen=login">Đăng nhập</Link></li><li><Link href="/lap-ke-hoach?screen=register">Tạo tài khoản</Link></li></ul></div><div><h3>Về Trip Vibes</h3><ul><li><Link href="/tro-giup">Trợ giúp</Link></li><li><Link href="/nguon-anh">Nguồn ảnh & ghi công</Link></li><li><Link href="/gioi-han">Thông tin dữ liệu</Link></li><li><Link href="/quyen-rieng-tu">Quyền riêng tư</Link></li><li><Link href="/dieu-khoan">Điều khoản sử dụng</Link></li></ul></div></div><div className={styles.footerBottom}><span>2026 Trip Vibes. Mỗi hành trình, một câu chuyện.</span><span>Dữ liệu địa điểm: OpenStreetMap contributors · Giá hiển thị là ước tính.</span></div></footer>; }
