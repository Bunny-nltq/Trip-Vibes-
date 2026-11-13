"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Coffee, Compass, Search, Utensils, X } from "lucide-react";
import { useVenueCatalog } from "@/ui/hooks/useVenueCatalog";
import { VenueCard, venueLabels } from "@/ui/components/site/VenueCard";
import styles from "@/ui/components/site/Public.module.css";

const pageSize = 24;
const defaultType = "experience";
const types = {
  experience: "Tham quan",
  dining: "Ẩm thực",
  restaurant: venueLabels.restaurant,
  eatery: venueLabels.eatery,
  cafe: venueLabels.cafe,
  museum: venueLabels.museum,
  memorial: venueLabels.memorial,
  monument: venueLabels.monument,
  heritage: venueLabels.heritage,
  tourist_attraction: venueLabels.tourist_attraction,
  amusement_park: venueLabels.amusement_park,
  gallery: venueLabels.gallery,
  park: venueLabels.park,
  beach: venueLabels.beach,
  viewpoint: venueLabels.viewpoint,
};
const quickFilters = [
  { type: "experience", label: "Tham quan", Icon: Compass },
  { type: "dining", label: "Ẩm thực", Icon: Utensils },
  { type: "cafe", label: "Cà phê", Icon: Coffee },
];
const outdoorTypes = ["park", "beach", "viewpoint"] as const;
const otherTypes = Object.entries(types).filter(([value]) => !outdoorTypes.some(outdoor => outdoor === value));

const initialFilters = { city: "", type: defaultType, query: "", offset: 0 };

function readFilters() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type") ?? defaultType;
  const isSupportedType = Object.hasOwn(types, type);
  const page = Number(params.get("page"));

  return {
    city: (params.get("city") ?? "").slice(0, 150),
    type: isSupportedType ? type : defaultType,
    query: (params.get("q") ?? "").slice(0, 150),
    offset: isSupportedType && Number.isSafeInteger(page * pageSize) && Number.isInteger(page) && page > 0
      ? (page - 1) * pageSize
      : 0,
  };
}

export function ExploreSection() {
  const [filters, setFilters] = useState(initialFilters);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const { city, type, query, offset } = filters;
  const data = useVenueCatalog(city, type, query, offset);
  const typeLabel = types[type as keyof typeof types];
  const canReset = city || type !== defaultType || query || offset > 0;

  useEffect(() => {
    function restoreFilters() {
      setFilters(readFilters());
    }
    restoreFilters();
    window.addEventListener("popstate", restoreFilters);
    return () => window.removeEventListener("popstate", restoreFilters);
  }, []);

  function updateFilters(next: typeof initialFilters) {
    setFilters(next);
    const url = new URL(window.location.href);
    url.searchParams.delete("city");
    url.searchParams.delete("type");
    url.searchParams.delete("q");
    url.searchParams.delete("page");
    if (next.city) url.searchParams.set("city", next.city);
    if (next.type !== defaultType) url.searchParams.set("type", next.type);
    if (next.query.trim()) url.searchParams.set("q", next.query.trim());
    if (next.offset) url.searchParams.set("page", String(next.offset / pageSize + 1));
    window.history.replaceState(null, "", url);
  }

  function changePage(nextOffset: number) {
    updateFilters({ ...filters, offset: nextOffset });
    resultsHeading.current?.focus();
  }

  return (
    <>
      <section className={`${styles.section} ${styles.exploreControls}`} id="kham-pha" aria-labelledby="experience-filters">
        <div className={styles.exploreFilterHeading}>
          <h2 id="experience-filters">Tìm trải nghiệm</h2>
          {canReset && (
            <button type="button" className={styles.exploreReset} onClick={() => updateFilters(initialFilters)}>
              <X size={14} aria-hidden="true" /> Xóa bộ lọc
            </button>
          )}
        </div>
        <div className={styles.exploreQuick} role="group" aria-label="Chủ đề trải nghiệm">
          {quickFilters.map(({ type: value, label, Icon }) => (
            <button
              type="button"
              className={styles.button}
              key={value}
              aria-pressed={type === value}
              onClick={() => updateFilters({ ...filters, type: value, offset: 0 })}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div className={`${styles.tabs} ${styles.exploreFields}`}>
          <label>
            Tìm địa điểm
            <span className={styles.exploreSearch}>
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={query}
                maxLength={150}
                placeholder="Tên địa điểm hoặc địa chỉ"
                onChange={event => updateFilters({ ...filters, query: event.target.value, offset: 0 })}
              />
            </span>
          </label>
          <label>
            Điểm đến
            <select value={city} onChange={event => updateFilters({ ...filters, city: event.target.value, offset: 0 })}>
              <option value="">Tất cả địa phương</option>
              {city && !data.cities.includes(city) && <option value={city}>{city}</option>}
              {data.cities.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label>
            Loại trải nghiệm
            <select value={type} onChange={event => updateFilters({ ...filters, type: event.target.value, offset: 0 })}>
              {otherTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              <optgroup label="Ngoài trời">
                {outdoorTypes.map(value => <option key={value} value={value}>{venueLabels[value]}</option>)}
              </optgroup>
            </select>
          </label>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="experience-results">
        <div className={styles.exploreSummary}>
          <div>
            <h2 id="experience-results" ref={resultsHeading} tabIndex={-1}>
              {typeLabel}{city && ` tại ${city}`}
            </h2>
            <p className={styles.muted} role="status">
              {data.loading ? "Đang tải địa điểm…" : !data.error && `${data.total} địa điểm${query.trim() ? ` cho “${query.trim()}”` : ""}`}
            </p>
          </div>
        </div>

        {!data.loading && (data.error ? (
          <div className={styles.exploreEmpty} role="alert">
            <p>Chưa thể tải địa điểm.</p>
            <button type="button" className={styles.button} onClick={() => window.location.reload()}>Thử lại</button>
          </div>
        ) : !data.places.length ? (
          <p className={styles.exploreEmpty}>Không tìm thấy địa điểm phù hợp. Hãy bỏ từ khóa, đổi địa phương hoặc xóa bộ lọc.</p>
        ) : (
          <div className={`${styles.grid} ${styles.exploreGrid}`}>
            {data.places.map(place => <VenueCard key={`${place.city}:${place.id}`} place={place} />)}
          </div>
        ))}

        {!data.loading && !data.error && (offset > 0 || data.total > pageSize) && (
          <nav className={styles.explorePagination} aria-label="Trang kết quả">
            <button type="button" className={styles.button} disabled={offset === 0} onClick={() => changePage(offset - pageSize)}>
              <ArrowLeft size={16} aria-hidden="true" /> Trang trước
            </button>
            {data.places.length > 0 && <span>{offset + 1}–{offset + data.places.length} / {data.total}</span>}
            <button type="button" className={styles.button} disabled={offset + pageSize >= data.total} onClick={() => changePage(offset + pageSize)}>
              Trang sau <ArrowRight size={16} aria-hidden="true" />
            </button>
          </nav>
        )}
      </section>
    </>
  );
}
