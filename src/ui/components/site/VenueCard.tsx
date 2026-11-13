import { MapPin, Clock, Phone, ExternalLink, Building2, Utensils, Coffee, Landmark, Trees, Navigation } from "lucide-react";
import type { VenuePublic } from "@/contracts";
import styles from "./Public.module.css";

export const venueLabels: Record<VenuePublic["type"], string> = {
  hotel: "Khách sạn",
  resort: "Resort",
  villa: "Villa",
  homestay: "Homestay",
  apartment: "Căn hộ dịch vụ",
  guest_house: "Nhà khách",
  restaurant: "Nhà hàng",
  eatery: "Quán ăn",
  cafe: "Cà phê",
  museum: "Bảo tàng",
  memorial: "Khu tưởng niệm",
  monument: "Tượng đài",
  heritage: "Di tích",
  tourist_attraction: "Điểm tham quan / khu du lịch",
  amusement_park: "Khu vui chơi",
  park: "Công viên",
  beach: "Bãi biển",
  viewpoint: "Điểm ngắm cảnh",
  gallery: "Phòng trưng bày",
  unknown: "Loại hình chưa xác nhận",
};

const sampleByType: Partial<Record<VenuePublic["type"], string>> = {
  restaurant: styles.sampleDining,
  eatery: styles.sampleDining,
  cafe: styles.sampleCafe,
  museum: styles.sampleMuseum,
  heritage: styles.sampleHeritage,
  park: styles.samplePark,
  beach: styles.sampleBeach,
  memorial: styles.sampleMemorial,
  monument: styles.sampleMonument,
  viewpoint: styles.sampleViewpoint,
  amusement_park: styles.sampleAmusement,
  gallery: styles.sampleGallery,
  tourist_attraction: styles.sampleAttraction,
};

export function VenueCard({ place }: { place: VenuePublic }) {
  const sample = place.group === "accommodation" ? styles.sampleLodging
    : place.group === "dining" ? styles.sampleDining
    : place.group === "cafe" ? styles.sampleCafe
    : sampleByType[place.type];
  const Icon = place.group === "accommodation"
    ? Building2
    : place.group === "dining"
    ? Utensils
    : place.group === "cafe"
    ? Coffee
    : ["museum", "memorial", "monument", "heritage"].includes(place.type)
    ? Landmark
    : Trees;

  return (
    <article className={styles.card}>
      {sample && (
        <div className={`${styles.photo} ${sample}`}>
          <span className={styles.sampleLabel}>Ảnh minh họa</span>
        </div>
      )}
      <div className={styles.body}>
        <span className={styles.tag}>
          <Icon size={14} />
          {venueLabels[place.type]} · {place.city}
        </span>
        <h3>{place.name}</h3>
        <p className={styles.muted}>
          <MapPin size={15} />
          {place.address || "Nguồn chưa ghi địa chỉ cụ thể; tìm trên Maps bằng tên và địa phương."}
        </p>
        {place.accommodationStars !== null && (
          <p>Hạng lưu trú {place.accommodationStars} sao theo nguồn · không phải điểm đánh giá Google</p>
        )}
        <details>
          <summary>Giờ hoạt động & thông tin chi tiết</summary>
          {place.description && <p>{place.description}</p>}
          <p>
            <Clock size={15} /> {place.openingHours || "Giờ hoạt động chưa được nguồn cung cấp."}
          </p>
          {place.cuisine && <p>Ẩm thực: {place.cuisine.split(";").join(", ")}</p>}
          {place.phone ? (
            <p>
              <Phone size={15} />
              {place.phone
                .split(/[;,/]/)
                .map((number) => number.trim())
                .filter(Boolean)
                .map((number) => (
                  <a key={number} href={`tel:${number.replace(/[^+0-9]/g, "")}`}>
                    {number}
                  </a>
                ))}
            </p>
          ) : (
            <p>Chưa có số liên hệ trong nguồn.</p>
          )}
          {place.bookingUnit === "room" && place.type === "villa" && (
            <p>Villa bán theo phòng; giá thuê nguyên căn cần xác nhận riêng.</p>
          )}
          {place.verifiedSource && (
            <p>
              <a href={place.verifiedSource} target="_blank" rel="noreferrer">
                Thông tin đối chiếu nguồn bổ sung
              </a>{" "}
              · {place.verifiedAt}
            </p>
          )}
          {place.website && place.websiteStatus === "unavailable" && (
            <p>Website trong nguồn hiện chưa truy cập được.</p>
          )}
          {place.website && place.websiteStatus !== "unavailable" && (
            <p>
              <a href={place.website} target="_blank" rel="noreferrer">
                Website theo nguồn
                <ExternalLink size={14} />
              </a>
            </p>
          )}
          <p>
            Tiếp cận xe lăn:{" "}
            {
              ({
                yes: "Có ghi nhận hỗ trợ",
                no: "Nguồn ghi không hỗ trợ",
                limited: "Hỗ trợ hạn chế",
                unknown: "Chưa có thông tin",
              } as const)[place.wheelchair || "unknown"]
            }
          </p>
          <p>
            <a href={place.sourceUrl} target="_blank" rel="noreferrer">
              {place.source}
            </a>{" "}
            · Cập nhật {place.fetchedAt.slice(0, 10)}
          </p>
          <p>Giờ/tiện ích có thể thay đổi; hãy xác nhận với địa điểm trước khi đến.</p>
        </details>
        <div className={styles.actions}>
          <a className={styles.link} href={place.directionsUrl} target="_blank" rel="noreferrer">
            <Navigation size={14} />
            Chỉ đường
          </a>
        </div>
      </div>
    </article>
  );
}
