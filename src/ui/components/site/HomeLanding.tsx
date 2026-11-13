"use client";

import { useState, type FormEvent } from "react";
import { returnDateOrderError } from "@/ui/messages/loi";
import { VietnameseDateInput } from "@/ui/components/VietnameseDateInput";
import Link from "next/link";
import Image from "next/image";
import { Mountain, Sparkles, MapPin, Plane, ArrowRight, Map, Eye, Camera, Zap, ShieldCheck, Heart, Compass, BookOpen } from "lucide-react";
import type { DiemDenThe } from "./ThuDiemDen";
import { usePublicAccount } from "@/ui/hooks/usePublicAccount";
import { AccountLinks } from "./AccountLinks";
import { PublicNav } from "./PublicNav";
import { publicTheme } from "./publicTheme";
import hero from "@/design/assets/coastal-journey-v3.png";
import styles from "./HomeLanding.module.css";

const features = [
  { title: "Hành trình theo ý bạn", text: "Tự chọn nơi đến, thời gian và những trải nghiệm yêu thích.", Icon: Map, Art: Plane, tone: "pink" },
  { title: "Thoải mái đổi kế hoạch", text: "Xem trước thay đổi và chi phí trước khi quyết định.", Icon: Eye, Art: MapPin, tone: "lavender" },
  { title: "Chi tiêu trong tầm tay", text: "Sau khi tạo chuyến đi, mở Sổ ngân sách để ghi và xem các khoản chi.", Icon: Camera, Art: BookOpen, tone: "mint" },
] as const;

const benefits = [
  { Icon: Zap, title: "Hiểu điều bạn thích", text: "Gợi ý theo sở thích và ngân sách bạn chọn." },
  { Icon: ShieldCheck, title: "Thông tin rõ ràng", text: "Phân biệt giá dự kiến và khoản tiền thực tế đã chi." },
  { Icon: Heart, title: "Dễ dàng bắt đầu", text: "Khám phá tự do, đăng nhập khi muốn lưu hành trình." },
  { Icon: Compass, title: "Luôn có điều mới", text: "Tìm những trải nghiệm thú vị quanh điểm dừng chân." },
];

export function HomeLanding({ diemDens }: { diemDens: DiemDenThe[] }) {
  const user = usePublicAccount();
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const invalidDateOrder = Boolean(departure && returnDate && returnDate < departure);

  function submit(event: FormEvent<HTMLFormElement>) {
    if (invalidDateOrder) {
      event.preventDefault();
    }
  }

  return (
    <div className={styles.landing} style={publicTheme}>
      <div className={styles.scene}>
        <Image className={styles.backdrop} src={hero} alt="" fill priority sizes="100vw" />
        <div className={styles.veil} />
        <header className={styles.header}>
          <Link href="/" className={styles.brand}>
            <Mountain aria-hidden="true" />
            <span><strong>Trip Vibes</strong><small>Mỗi hành trình, một câu chuyện</small></span>
          </Link>
          <PublicNav current="/" mobileAccount={<AccountLinks user={user} />} />
          <div className={styles.desktopAccount}><AccountLinks user={user} /></div>
        </header>
        <section className={styles.hero} aria-labelledby="home-title">
          <span className={styles.badge}><Sparkles size={16} />Cảm hứng cho chuyến đi tiếp theo</span>
          <h1 id="home-title">Một nơi mới.<br /><span>Một hành trình của riêng bạn.</span></h1>
          <p>
            Từ buổi cà phê bình yên đến những ngày rong ruổi.{" "}
            <br />Cùng Trip Vibes biến điều bạn muốn thành hành trình đáng nhớ.
          </p>
          <form action="/lap-ke-hoach" className={styles.search} onSubmit={submit}>
            <label>
              <MapPin aria-hidden="true" />
              <input aria-label="Bạn muốn đi đâu?" name="diemDen" required placeholder="Bạn muốn đi đâu?" list="home-destinations" />
              <datalist id="home-destinations">
                {diemDens.filter(d => !["bangkok", "seoul"].includes(d.id)).map(d => <option key={d.id} value={d.ten} />)}
              </datalist>
            </label>
            <label>
              <span>Ngày đi
                <VietnameseDateInput aria-label="Ngày đi" name="departureDate" required onValueChange={setDeparture} />
              </span>
            </label>
            <label>
              <span>Ngày về
                <VietnameseDateInput
                  aria-label="Ngày về"
                  aria-invalid={invalidDateOrder || undefined}
                  aria-describedby={invalidDateOrder ? "home-return-date-error" : undefined}
                  name="returnDate"
                  required
                  onValueChange={setReturnDate}
                />
                {invalidDateOrder && (
                  <small className={styles.dateError} id="home-return-date-error" role="alert">
                    {returnDateOrderError}
                  </small>
                )}
              </span>
            </label>
            <button type="submit"><Plane size={19} />Lên kế hoạch</button>
          </form>
          <div className={styles.heroLinks}>
            <Link href="#kham-pha">Tìm cảm hứng trước<ArrowRight size={16} /></Link>
            <span>Không cần tài khoản để bắt đầu</span>
          </div>
        </section>
      </div>
      <section className={styles.features} aria-label="Cùng bạn trong mỗi bước đi">
        {features.map(({ title, text, Icon, Art, tone }) => (
          <Link href="/lap-ke-hoach" key={title} className={`${styles.feature} ${styles[tone]}`}>
            <div className={styles.featureIcon}><Icon /></div>
            <Art className={styles.art} aria-hidden="true" />
            <h2>{title}</h2>
            <p>{text}</p>
            <span className={styles.arrow}><ArrowRight size={18} /></span>
          </Link>
        ))}
      </section>
      <section className={styles.benefits}>
        <div className={styles.sectionTitle}>
          <small>ĐI CÙNG TRIP VIBES</small>
          <h2>Ít lo toan hơn, nhiều trải nghiệm hơn</h2>
          <span />
        </div>
        <div className={styles.benefitGrid}>
          {benefits.map(({ Icon, title, text }) => (
            <div className={styles.benefit} key={title}>
              <span><Icon /></span>
              <div><h3>{title}</h3><p>{text}</p></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
