"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import fallback from "@/design/assets/coastal-journey-v3.png";
import { getDestinationImage } from "@/ui/lib/imageMap";
import styles from "./Public.module.css";

const featured = [
  { slug: "da-nang", name: "Đà Nẵng", description: "Dạo biển Mỹ Khê, ngắm Cầu Rồng và khám phá bán đảo Sơn Trà." },
  { slug: "ha-noi", name: "Hà Nội", description: "Tản bộ quanh Hồ Gươm, ghé phố cổ và thưởng thức ẩm thực Hà Nội." },
  { slug: "hoi-an", name: "Hội An", description: "Dạo phố cổ dưới đèn lồng và ngắm chiều xuống bên sông Hoài." },
  { slug: "da-lat", name: "Đà Lạt", description: "Ghé hồ Xuân Hương, dạo đồi thông và tìm một quán cà phê nhìn ra thung lũng." },
  { slug: "hue", name: "Huế", description: "Thăm Đại Nội, dạo bên sông Hương và khám phá ẩm thực cố đô." },
].map(destination => ({ ...destination, photo: getDestinationImage(destination.name) }));

export function ExperienceCarousel() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const slide = featured[index];
  const useFallback = failed[slide.slug] || !slide.photo.linkGoc;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function stopForReducedMotion() {
      if (preference.matches) setPlaying(false);
    }
    stopForReducedMotion();
    preference.addEventListener("change", stopForReducedMotion);
    return () => preference.removeEventListener("change", stopForReducedMotion);
  }, []);

  useEffect(() => {
    if (!playing || hovered) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % featured.length), 6500);
    return () => window.clearInterval(timer);
  }, [playing, hovered]);

  function goTo(next: number) {
    setPlaying(false);
    setIndex((next + featured.length) % featured.length);
  }

  return (
    <section
      className={styles.experienceCarousel}
      aria-label="Điểm đến nổi bật"
      aria-roledescription="Băng chuyền"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        className={styles.carouselPlayback}
        type="button"
        aria-label={playing ? "Tạm dừng tự chuyển banner" : "Bật tự chuyển banner"}
        onClick={() => setPlaying(current => !current)}
      >
        {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
      </button>

      <div className={styles.carouselSlide} aria-live={playing ? "off" : "polite"}>
        <Image
          key={slide.slug}
          src={useFallback ? fallback : slide.photo.urlThumb}
          alt={useFallback ? "" : slide.photo.alt}
          onError={() => {
            if (!useFallback) setFailed(current => ({ ...current, [slide.slug]: true }));
          }}
          fill
          sizes="(max-width: 1092px) 96vw, 1060px"
          loading="eager"
          unoptimized={!useFallback}
        />
        <div className={styles.carouselCopy}>
          <h1>{slide.name}</h1>
          <p>{slide.description}</p>
          <Link className={styles.button} href={`/diem-den/${slide.slug}`} onFocus={() => setPlaying(false)}>
            Khám phá {slide.name} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className={styles.carouselFooter}>
        <div className={styles.carouselNavigation} role="group" aria-label="Chọn banner điểm đến">
          <button type="button" aria-label="Banner trước" onFocus={() => setPlaying(false)} onClick={() => goTo(index - 1)}>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          {featured.map((destination, position) => (
            <button
              className={styles.carouselDot}
              type="button"
              key={destination.slug}
              aria-label={`Hiện banner ${destination.name}`}
              aria-current={position === index ? "true" : undefined}
              onFocus={() => setPlaying(false)}
              onClick={() => goTo(position)}
            />
          ))}
          <button type="button" aria-label="Banner sau" onFocus={() => setPlaying(false)} onClick={() => goTo(index + 1)}>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
        <span className={styles.carouselCredit}>
          {useFallback ? "Ảnh minh họa" : (
            <a href={slide.photo.linkGoc} target="_blank" rel="noreferrer" onFocus={() => setPlaying(false)}>
              {slide.photo.tacGia} · {slide.photo.giayPhep}
            </a>
          )}
        </span>
      </div>
    </section>
  );
}
