/**
 * src/ui/lib/imageMap.ts
 *
 * Bản đồ liên kết ảnh thật từ Wikimedia Commons (có đầy đủ tác giả, giấy phép CC theo QT-24)
 * và ảnh mẫu fallback chất lượng cao cho toàn bộ ứng dụng Trip Vibes.
 */

import anhDiemDenData from "@/design/anh-diem-den.json";
import journeyScene from "@/design/assets/coastal-journey-v3.png";

export interface ImageInfo {
  url: string;
  urlThumb: string;
  alt: string;
  diaDanh: string;
  tacGia: string;
  nguon: string;
  giayPhep: string;
  linkGoc?: string;
  linkGiayPhep?: string;
}

const NORM_LOOKUP: Record<string, string> = {
  "đà nẵng": "da-nang",
  "da nang": "da-nang",
  "hà nội": "ha-noi",
  "ha noi": "ha-noi",
  "đà lạt": "da-lat",
  "da lat": "da-lat",
  "bangkok": "bangkok",
  "băng cốc": "bangkok",
  "seoul": "seoul",
  "phú quốc": "phu-quoc",
  "phu quoc": "phu-quoc",
  "nha trang": "nha-trang",
  "tokyo": "tokyo",
  "tp.hcm": "tp-hcm",
  "tp hcm": "tp-hcm",
  "hồ chí minh": "tp-hcm",
  "sài gòn": "tp-hcm",
  "hội an": "hoi-an",
  "hoi an": "hoi-an",
  "huế": "hue",
  "hue": "hue",
};

const journeyUrl=typeof journeyScene==="string"?journeyScene:journeyScene.src;
function illustration(name?:string|null):ImageInfo {return {url:journeyUrl,urlThumb:journeyUrl,alt:`Minh họa hành trình${name?`: ${name}`:""}`,diaDanh:"Phong cảnh minh họa",tacGia:"Minh họa AI cho Trip Vibes",nguon:"OpenAI Image Generation",giayPhep:"Minh họa tạo bằng AI"};}
/** Unknown destinations use an illustration, never a photo of an assumed city. */
export function getDestinationImage(name?:string|null):ImageInfo {
 if(!name)return illustration();
 const clean=name.toLowerCase().trim();const direct=NORM_LOOKUP[clean];const matched=Object.keys(NORM_LOOKUP).find(key=>clean.includes(key));const slug=direct||(matched?NORM_LOOKUP[matched]:null);
 const candidate=slug?(anhDiemDenData as Record<string,unknown>)[slug]:null;
 if(!candidate||typeof candidate!=="object")return illustration(name);
 const image=candidate as ImageInfo;
 return image.tacGia==="CC-Photographer"||image.tacGia==="Wikimedia Commons"?illustration(name):image;
}

function pickFromPool(pool: ImageInfo[], name?: string): ImageInfo {
  const hash = (name || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const chosen = pool[Math.abs(hash) % pool.length];
  return { ...chosen, alt: name || chosen.alt };
}

const DALAT_HOTELS: ImageInfo[] = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Dalat_Palace_Heritage_Hotel.JPG/960px-Dalat_Palace_Heritage_Hotel.JPG",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Dalat_Palace_Heritage_Hotel.JPG/960px-Dalat_Palace_Heritage_Hotel.JPG",
    alt: "Dalat Palace Heritage Hotel",
    diaDanh: "Khách sạn cổ kính đồi thông Đà Lạt",
    tacGia: "Gryffindor",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 3.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Good_Morning_Dalat_%28253557595%29.jpeg/960px-Good_Morning_Dalat_%28253557595%29.jpeg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Good_Morning_Dalat_%28253557595%29.jpeg/960px-Good_Morning_Dalat_%28253557595%29.jpeg",
    alt: "Resort & Biệt thự nghỉ dưỡng Đà Lạt",
    diaDanh: "Resort & Biệt thự sương mù Đà Lạt",
    tacGia: "Dao Hoang Duong",
    nguon: "Wikimedia Commons",
    giayPhep: "CC0 Public Domain",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/French_colonial_villas_in_Da_Lat_01.jpg/960px-French_colonial_villas_in_Da_Lat_01.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/French_colonial_villas_in_Da_Lat_01.jpg/960px-French_colonial_villas_in_Da_Lat_01.jpg",
    alt: "Biệt thự kiến trúc Pháp Đà Lạt",
    diaDanh: "Khu biệt thự nghỉ dưỡng cao nguyên",
    tacGia: "Tran Nghi",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 4.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Prenn_waterfall_in_Dalat.jpg/960px-Prenn_waterfall_in_Dalat.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Prenn_waterfall_in_Dalat.jpg/960px-Prenn_waterfall_in_Dalat.jpg",
    alt: "Khu nghỉ dưỡng sinh thái Đà Lạt",
    diaDanh: "Resort ven đồi thông Đà Lạt",
    tacGia: "Linhcandng",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 3.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Xuan_Huong_Lake_08.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Xuan_Huong_Lake_08.jpg",
    alt: "Khách sạn hướng hồ Xuân Hương Đà Lạt",
    diaDanh: "Lưu trú trung tâm hồ Xuân Hương",
    tacGia: "Diane Selwyn",
    nguon: "Wikimedia Commons",
    giayPhep: "Public Domain",
  },
];

const HANOI_HOTELS: ImageInfo[] = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Hotel_Metropole_Hanoi_0419.JPG/960px-Hotel_Metropole_Hanoi_0419.JPG",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Hotel_Metropole_Hanoi_0419.JPG/960px-Hotel_Metropole_Hanoi_0419.JPG",
    alt: "Hotel Metropole Hanoi",
    diaDanh: "Khách sạn di sản Hà Nội",
    tacGia: "Gryffindor",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 3.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Hanoi_Daewoo_Hotel_2011.JPG/960px-Hanoi_Daewoo_Hotel_2011.JPG",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Hanoi_Daewoo_Hotel_2011.JPG/960px-Hanoi_Daewoo_Hotel_2011.JPG",
    alt: "Hanoi Daewoo Hotel",
    diaDanh: "Khách sạn cao cấp Ba Đình Hà Nội",
    tacGia: "Gryffindor",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 3.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Melia_Hanoi_Hotel.jpg/960px-Melia_Hanoi_Hotel.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Melia_Hanoi_Hotel.jpg/960px-Melia_Hanoi_Hotel.jpg",
    alt: "Melia Hanoi Hotel",
    diaDanh: "Khách sạn trung tâm Hoàn Kiếm",
    tacGia: "Gryffindor",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 3.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hoan_Kiem_Lake_Hanoi_Vietnam.JPG/960px-Hoan_Kiem_Lake_Hanoi_Vietnam.JPG",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hoan_Kiem_Lake_Hanoi_Vietnam.JPG/960px-Hoan_Kiem_Lake_Hanoi_Vietnam.JPG",
    alt: "Khách sạn Phố Cổ Hà Nội",
    diaDanh: "Khách sạn tiện nghi khu phố cổ",
    tacGia: "Gryffindor",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 3.0",
  },
];

const HOIAN_HOTELS: ImageInfo[] = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hoi_An_ancient_town_night_lights.jpg/960px-Hoi_An_ancient_town_night_lights.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hoi_An_ancient_town_night_lights.jpg/960px-Hoi_An_ancient_town_night_lights.jpg",
    alt: "Resort & Khách sạn phố cổ Hội An",
    diaDanh: "Khách sạn phong cách phố cổ",
    tacGia: "Gryffindor",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 3.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Japanese_Bridge_Hoi_An.jpg/960px-Japanese_Bridge_Hoi_An.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Japanese_Bridge_Hoi_An.jpg/960px-Japanese_Bridge_Hoi_An.jpg",
    alt: "Khách sạn di sản Hội An",
    diaDanh: "Lưu trú gần Chùa Cầu Hội An",
    tacGia: "Jean-Pierre Dalbéra",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY 2.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/MGarden_City_Hotel_Danang.jpg/960px-MGarden_City_Hotel_Danang.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/MGarden_City_Hotel_Danang.jpg/960px-MGarden_City_Hotel_Danang.jpg",
    alt: "Boutique Resort Hội An ven sông",
    diaDanh: "Resort sinh thái ven sông Thu Bồn",
    tacGia: "Linhcandng",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 4.0",
  },
];

const HUE_HOTELS: ImageInfo[] = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Hotel_Saigon_Morin_Hue.jpg/960px-Hotel_Saigon_Morin_Hue.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Hotel_Saigon_Morin_Hue.jpg/960px-Hotel_Saigon_Morin_Hue.jpg",
    alt: "Hotel Saigon Morin Huế",
    diaDanh: "Khách sạn di sản hơn 100 năm ven sông Hương",
    tacGia: "Jean-Pierre Dalbéra",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY 2.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Gate_in_Imperial_City%2C_Hu%E1%BA%BF_%28III%29.jpg/960px-Gate_in_Imperial_City%2C_Hu%E1%BA%BF_%28III%29.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Gate_in_Imperial_City%2C_Hu%E1%BA%BF_%28III%29.jpg/960px-Gate_in_Imperial_City%2C_Hu%E1%BA%BF_%28III%29.jpg",
    alt: "Azerai La Residence Huế & Spa",
    diaDanh: "Resort phong cách cổ đô sông Hương",
    tacGia: "Supanut Arunoprayote",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY 4.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Thien_Mu_Pagoda_Hue.jpg/960px-Thien_Mu_Pagoda_Hue.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Thien_Mu_Pagoda_Hue.jpg/960px-Thien_Mu_Pagoda_Hue.jpg",
    alt: "Hương Giang Hotel Resort Huế",
    diaDanh: "Khách sạn ven bờ sông Hương",
    tacGia: "Jean-Pierre Dalbéra",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY 2.0",
  },
];

const NHATRANG_HOTELS: ImageInfo[] = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Sheraton_Nha_Trang.jpg/960px-Sheraton_Nha_Trang.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Sheraton_Nha_Trang.jpg/960px-Sheraton_Nha_Trang.jpg",
    alt: "Sheraton Nha Trang Hotel",
    diaDanh: "Khách sạn cao cấp đường Trần Phú Nha Trang",
    tacGia: "Linhcandng",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 3.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Nha_Trang_Beach_7.jpg/960px-Nha_Trang_Beach_7.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Nha_Trang_Beach_7.jpg/960px-Nha_Trang_Beach_7.jpg",
    alt: "Vinpearl Resort Nha Trang Bay",
    diaDanh: "Khu nghỉ dưỡng ven biển vịnh Nha Trang",
    tacGia: "Christophe95",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 4.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Po_Nagar_Nha_Trang_2011.JPG/960px-Po_Nagar_Nha_Trang_2011.JPG",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Po_Nagar_Nha_Trang_2011.JPG/960px-Po_Nagar_Nha_Trang_2011.JPG",
    alt: "Sunrise Nha Trang Beach Hotel",
    diaDanh: "Khách sạn phong cách ven biển Nha Trang",
    tacGia: "Gryffindor",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 3.0",
  },
];

const DANANG_HOTELS: ImageInfo[] = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Novotel_Danang_Premier_Han_River.jpeg/960px-Novotel_Danang_Premier_Han_River.jpeg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Novotel_Danang_Premier_Han_River.jpeg/960px-Novotel_Danang_Premier_Han_River.jpeg",
    alt: "Novotel Danang Premier sông Hàn",
    diaDanh: "Khách sạn cao cấp ven sông Hàn",
    tacGia: "Linhcandng",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 3.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/MGarden_City_Hotel_Danang.jpg/960px-MGarden_City_Hotel_Danang.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/MGarden_City_Hotel_Danang.jpg/960px-MGarden_City_Hotel_Danang.jpg",
    alt: "Khách sạn M Garden City Đà Nẵng",
    diaDanh: "Khách sạn sinh thái M Garden City",
    tacGia: "Linhcandng",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 4.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Danang_Golden_Bay_Hotel.jpeg/960px-Danang_Golden_Bay_Hotel.jpeg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Danang_Golden_Bay_Hotel.jpeg/960px-Danang_Golden_Bay_Hotel.jpeg",
    alt: "Danang Golden Bay Hotel",
    diaDanh: "Khách sạn nghỉ dưỡng 5 sao Golden Bay",
    tacGia: "Linhcandng",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 3.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Regis_Bay_Danang_Hotel.jpeg/960px-Regis_Bay_Danang_Hotel.jpeg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Regis_Bay_Danang_Hotel.jpeg/960px-Regis_Bay_Danang_Hotel.jpeg",
    alt: "Khách sạn Regis Bay Đà Nẵng",
    diaDanh: "Khách sạn vịnh Regis Bay",
    tacGia: "Linhcandng",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY-SA 3.0",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Danang_Riverside_Hotel_entrance.jpg/960px-Danang_Riverside_Hotel_entrance.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Danang_Riverside_Hotel_entrance.jpg/960px-Danang_Riverside_Hotel_entrance.jpg",
    alt: "Khách sạn tiện nghi trung tâm Đà Nẵng",
    diaDanh: "Danang Riverside Hotel",
    tacGia: "Joseph Hunkins",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY 2.0",
  },
];

function hotelImageSource(
  stars?: number | null,
  name?: string,
  destinationName?: string
): ImageInfo {
  const destClean = (destinationName || name || "").toLowerCase();

  if (destClean.includes("đà lạt") || destClean.includes("da lat")) {
    return pickFromPool(DALAT_HOTELS, name);
  }

  if (destClean.includes("hà nội") || destClean.includes("ha noi")) {
    return pickFromPool(HANOI_HOTELS, name);
  }

  if (destClean.includes("hội an") || destClean.includes("hoi an")) {
    return pickFromPool(HOIAN_HOTELS, name);
  }

  if (destClean.includes("huế") || destClean.includes("hue")) {
    return pickFromPool(HUE_HOTELS, name);
  }

  if (destClean.includes("nha trang")) {
    return pickFromPool(NHATRANG_HOTELS, name);
  }

  if (destClean.includes("bangkok") || destClean.includes("băng cốc")) {
    return {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Four_Seasons_Hotel_Bangkok_at_Chao_Phraya_River_at_twilight_1.jpg/960px-Four_Seasons_Hotel_Bangkok_at_Chao_Phraya_River_at_twilight_1.jpg",
      urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Four_Seasons_Hotel_Bangkok_at_Chao_Phraya_River_at_twilight_1.jpg/960px-Four_Seasons_Hotel_Bangkok_at_Chao_Phraya_River_at_twilight_1.jpg",
      alt: name || "Khách sạn ven sông Chao Phraya Bangkok",
      diaDanh: "Khách sạn cao cấp bờ sông Chao Phraya",
      tacGia: "Tree Lightbulb",
      nguon: "Wikimedia Commons",
      giayPhep: "CC0 Public Domain",
    };
  }

  if (destClean.includes("seoul")) {
    return {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Ramada_Hotel_%26_Suites_Seoul_Namdaemun.JPG/960px-Ramada_Hotel_%26_Suites_Seoul_Namdaemun.JPG",
      urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Ramada_Hotel_%26_Suites_Seoul_Namdaemun.JPG/960px-Ramada_Hotel_%26_Suites_Seoul_Namdaemun.JPG",
      alt: name || "Khách sạn trung tâm Seoul",
      diaDanh: "Khách sạn trung tâm Namdaemun, Seoul",
      tacGia: "Abasaa",
      nguon: "Wikimedia Commons",
      giayPhep: "Public Domain",
    };
  }

  if (destClean.includes("phú quốc") || destClean.includes("phu quoc")) {
    return {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Phu_Quoc_beach_Saigon_Phu_Quoc_Resort_and_Spa.jpg/960px-Phu_Quoc_beach_Saigon_Phu_Quoc_Resort_and_Spa.jpg",
      urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Phu_Quoc_beach_Saigon_Phu_Quoc_Resort_and_Spa.jpg/960px-Phu_Quoc_beach_Saigon_Phu_Quoc_Resort_and_Spa.jpg",
      alt: name || "Resort & Spa Bãi biển Phú Quốc",
      diaDanh: "Resort bãi biển Phú Quốc",
      tacGia: "Elmschrat",
      nguon: "Wikimedia Commons",
      giayPhep: "CC0 Public Domain",
    };
  }

  if (stars && stars >= 4) {
    const luxuryPool = [DANANG_HOTELS[0], DANANG_HOTELS[2], DANANG_HOTELS[3]];
    return pickFromPool(luxuryPool, name);
  }

  return pickFromPool(DANANG_HOTELS, name);
}

export function getHotelImage(stars?: number | null, name?: string, destinationName?: string): ImageInfo {
  const image = hotelImageSource(stars, name, destinationName);
  return image.tacGia === "CC-Photographer" || image.tacGia === "Wikimedia Commons" ? illustration(destinationName) : image;
}

/** Lấy ảnh ẩm thực thật từ Wikimedia Commons */
export function getRestaurantImage(name?: string, cuisine?: string | null): ImageInfo {
  const clean = ((name || "") + " " + (cuisine || "")).toLowerCase();

  if (clean.includes("bánh mì") || clean.includes("banh mi") || clean.includes("ăn nhanh")) {
    return {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/B%C3%A1nh_m%C3%AC.jpg/960px-B%C3%A1nh_m%C3%AC.jpg",
      urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/B%C3%A1nh_m%C3%AC.jpg/960px-B%C3%A1nh_m%C3%AC.jpg",
      alt: name || "Bánh mì Việt Nam truyền thống",
      diaDanh: "Ẩm thực đường phố Việt Nam",
      tacGia: "Wikimedia Commons",
      nguon: "Wikimedia Commons",
      giayPhep: "CC BY-SA",
    };
  }

  return {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/2016.10.14.133502_Noodle_soup_beef_Pho_Bac_Vietnamese_restaurant_Seattle_Washington_USA.jpg/960px-2016.10.14.133502_Noodle_soup_beef_Pho_Bac_Vietnamese_restaurant_Seattle_Washington_USA.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/2016.10.14.133502_Noodle_soup_beef_Pho_Bac_Vietnamese_restaurant_Seattle_Washington_USA.jpg/960px-2016.10.14.133502_Noodle_soup_beef_Pho_Bac_Vietnamese_restaurant_Seattle_Washington_USA.jpg",
    alt: name || "Phở bò truyền thống Việt Nam",
    diaDanh: "Món ngon truyền thống",
    tacGia: "Hermann Luyken",
    nguon: "Wikimedia Commons",
    giayPhep: "CC0 Public Domain",
  };
}

/** Lấy ảnh quán cà phê thật từ Wikimedia Commons */
export function getCafeImage(name?: string): ImageInfo {
  return {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Ca_Phe_Sua_Da.jpg/960px-Ca_Phe_Sua_Da.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Ca_Phe_Sua_Da.jpg/960px-Ca_Phe_Sua_Da.jpg",
    alt: name || "Cà phê sữa đá pha phin truyền thống",
    diaDanh: "Văn hóa cà phê Việt Nam",
    tacGia: "Clarin",
    nguon: "Wikimedia Commons",
    giayPhep: "CC BY 2.5",
  };
}

/** Lấy ảnh minh họa hoạt động trải nghiệm thật theo loại */
export function getActivityImage(hangMuc?: string, tenHoatDong?: string): ImageInfo {
  const clean = (tenHoatDong || "").toLowerCase();

  if (clean.includes("biển") || clean.includes("bãi") || clean.includes("tắm") || clean.includes("đảo")) {
    return {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Nha_Trang_Beach_7.jpg/960px-Nha_Trang_Beach_7.jpg",
      urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Nha_Trang_Beach_7.jpg/960px-Nha_Trang_Beach_7.jpg",
      alt: tenHoatDong || "Hoạt động biển đảo giải trí",
      diaDanh: "Bãi biển danh lam",
      tacGia: "Christophe95",
      nguon: "Wikimedia Commons",
      giayPhep: "CC BY-SA 4.0",
    };
  }

  if (clean.includes("chùa") || clean.includes("đền") || clean.includes("tháp") || clean.includes("cổ") || clean.includes("hoàng thành") || clean.includes("di tích")) {
    return {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Gate_in_Imperial_City%2C_Hu%E1%BA%BF_%28III%29.jpg/960px-Gate_in_Imperial_City%2C_Hu%E1%BA%BF_%28III%29.jpg",
      urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Gate_in_Imperial_City%2C_Hu%E1%BA%BF_%28III%29.jpg/960px-Gate_in_Imperial_City%2C_Hu%E1%BA%BF_%28III%29.jpg",
      alt: tenHoatDong || "Tham quan di tích lịch sử văn hóa",
      diaDanh: "Di tích lịch sử",
      tacGia: "Supanut Arunoprayote",
      nguon: "Wikimedia Commons",
      giayPhep: "CC BY 4.0",
    };
  }

  if (clean.includes("chợ") || clean.includes("phố đi bộ") || clean.includes("đèn lồng") || clean.includes("đêm")) return illustration(tenHoatDong);

  return {
    url: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Xuan_Huong_Lake_08.jpg",
    urlThumb: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Xuan_Huong_Lake_08.jpg",
    alt: tenHoatDong || "Hoạt động du lịch ngắm cảnh sinh thái",
    diaDanh: "Danh lam thắng cảnh",
    tacGia: "Diane Selwyn",
    nguon: "Wikimedia Commons",
    giayPhep: "Public Domain",
  };
}

/** Lấy ảnh trải nghiệm văn hóa / tham quan / danh lam theo địa danh */
export function getExperienceImage(name?: string, city?: string, type?: string): ImageInfo {
  const clean = ((name || "") + " " + (city || "") + " " + (type || "")).toLowerCase();

  if (clean.includes("huế") || clean.includes("hue")) {
    const HUE_EXP: ImageInfo[] = [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Gate_in_Imperial_City%2C_Hu%E1%BA%BF_%28III%29.jpg/960px-Gate_in_Imperial_City%2C_Hu%E1%BA%BF_%28III%29.jpg",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Gate_in_Imperial_City%2C_Hu%E1%BA%BF_%28III%29.jpg/960px-Gate_in_Imperial_City%2C_Hu%E1%BA%BF_%28III%29.jpg",
        alt: name || "Hoàng Thành Huế",
        diaDanh: "Đại Nội Huế",
        tacGia: "Supanut Arunoprayote",
        nguon: "Wikimedia Commons",
        giayPhep: "CC BY 4.0",
      },
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Tomb_of_Khai_Dinh_Hue.jpg/960px-Tomb_of_Khai_Dinh_Hue.jpg",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Tomb_of_Khai_Dinh_Hue.jpg/960px-Tomb_of_Khai_Dinh_Hue.jpg",
        alt: name || "Lăng Khải Định Huế",
        diaDanh: "Lăng tẩm cố đô Huế",
        tacGia: "Jean-Pierre Dalbéra",
        nguon: "Wikimedia Commons",
        giayPhep: "CC BY 2.0",
      },
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Thien_Mu_Pagoda_Hue.jpg/960px-Thien_Mu_Pagoda_Hue.jpg",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Thien_Mu_Pagoda_Hue.jpg/960px-Thien_Mu_Pagoda_Hue.jpg",
        alt: name || "Chùa Thiên Mụ Huế",
        diaDanh: "Di tích lịch sử danh lam Huế",
        tacGia: "Jean-Pierre Dalbéra",
        nguon: "Wikimedia Commons",
        giayPhep: "CC BY 2.0",
      },
    ];
    return pickFromPool(HUE_EXP, name);
  }

  if (clean.includes("hội an") || clean.includes("hoi an")) {
    const HOIAN_EXP: ImageInfo[] = [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hoi_An_ancient_town_night_lights.jpg/960px-Hoi_An_ancient_town_night_lights.jpg",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hoi_An_ancient_town_night_lights.jpg/960px-Hoi_An_ancient_town_night_lights.jpg",
        alt: name || "Phố cổ Hội An",
        diaDanh: "Di sản văn hóa Hội An",
        tacGia: "Gryffindor",
        nguon: "Wikimedia Commons",
        giayPhep: "CC BY-SA 3.0",
      },
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Japanese_Bridge_Hoi_An.jpg/960px-Japanese_Bridge_Hoi_An.jpg",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Japanese_Bridge_Hoi_An.jpg/960px-Japanese_Bridge_Hoi_An.jpg",
        alt: name || "Chùa Cầu Hội An",
        diaDanh: "Nhà cổ & Di tích Hội An",
        tacGia: "Jean-Pierre Dalbéra",
        nguon: "Wikimedia Commons",
        giayPhep: "CC BY 2.0",
      },
    ];
    return pickFromPool(HOIAN_EXP, name);
  }

  if (clean.includes("đà lạt") || clean.includes("da lat")) {
    const DALAT_EXP: ImageInfo[] = [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Prenn_waterfall_in_Dalat.jpg/960px-Prenn_waterfall_in_Dalat.jpg",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Prenn_waterfall_in_Dalat.jpg/960px-Prenn_waterfall_in_Dalat.jpg",
        alt: name || "Thác nước sinh thái Đà Lạt",
        diaDanh: "Thắng cảnh cao nguyên Đà Lạt",
        tacGia: "Linhcandng",
        nguon: "Wikimedia Commons",
        giayPhep: "CC BY-SA 3.0",
      },
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Xuan_Huong_Lake_08.jpg",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Xuan_Huong_Lake_08.jpg",
        alt: name || "Hồ Xuân Hương Đà Lạt",
        diaDanh: "Cảnh quan thiên nhiên Đà Lạt",
        tacGia: "Diane Selwyn",
        nguon: "Wikimedia Commons",
        giayPhep: "Public Domain",
      },
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/French_colonial_villas_in_Da_Lat_01.jpg/960px-French_colonial_villas_in_Da_Lat_01.jpg",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/French_colonial_villas_in_Da_Lat_01.jpg/960px-French_colonial_villas_in_Da_Lat_01.jpg",
        alt: name || "Kiến trúc hoa viên Đà Lạt",
        diaDanh: "Khu du lịch sinh thái Đà Lạt",
        tacGia: "Tran Nghi",
        nguon: "Wikimedia Commons",
        giayPhep: "CC BY-SA 4.0",
      },
    ];
    return pickFromPool(DALAT_EXP, name);
  }

  if (clean.includes("nha trang")) {
    const NHATRANG_EXP: ImageInfo[] = [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Nha_Trang_Beach_7.jpg/960px-Nha_Trang_Beach_7.jpg",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Nha_Trang_Beach_7.jpg/960px-Nha_Trang_Beach_7.jpg",
        alt: name || "Bãi biển Nha Trang",
        diaDanh: "Vịnh biển Nha Trang",
        tacGia: "Christophe95",
        nguon: "Wikimedia Commons",
        giayPhep: "CC BY-SA 4.0",
      },
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Po_Nagar_Nha_Trang_2011.JPG/960px-Po_Nagar_Nha_Trang_2011.JPG",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Po_Nagar_Nha_Trang_2011.JPG/960px-Po_Nagar_Nha_Trang_2011.JPG",
        alt: name || "Tháp Bà Ponagar Nha Trang",
        diaDanh: "Di tích lịch sử văn hóa Nha Trang",
        tacGia: "Gryffindor",
        nguon: "Wikimedia Commons",
        giayPhep: "CC BY-SA 3.0",
      },
    ];
    return pickFromPool(NHATRANG_EXP, name);
  }

  if (clean.includes("đà nẵng") || clean.includes("da nang")) {
    const DANANG_EXP: ImageInfo[] = [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Dragon_Bridge_at_night_in_Da_Nang.jpg/960px-Dragon_Bridge_at_night_in_Da_Nang.jpg",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Dragon_Bridge_at_night_in_Da_Nang.jpg/960px-Dragon_Bridge_at_night_in_Da_Nang.jpg",
        alt: name || "Cầu Rồng Đà Nẵng",
        diaDanh: "Cầu Rồng & Sông Hàn",
        tacGia: "Linhcandng",
        nguon: "Wikimedia Commons",
        giayPhep: "CC BY-SA 4.0",
      },
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Hai_Van_Pass_view.jpg/960px-Hai_Van_Pass_view.jpg",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Hai_Van_Pass_view.jpg/960px-Hai_Van_Pass_view.jpg",
        alt: name || "Đèo Hải Vân",
        diaDanh: "Danh thắng Đà Nẵng",
        tacGia: "Linhcandng",
        nguon: "Wikimedia Commons",
        giayPhep: "CC BY 3.0",
      },
    ];
    return pickFromPool(DANANG_EXP, name);
  }

  if (clean.includes("hà nội") || clean.includes("ha noi")) {
    const HANOI_EXP: ImageInfo[] = [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Imperial_Citadel_of_Thang_Long_Hanoi_2011.JPG/960px-Imperial_Citadel_of_Thang_Long_Hanoi_2011.JPG",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Imperial_Citadel_of_Thang_Long_Hanoi_2011.JPG/960px-Imperial_Citadel_of_Thang_Long_Hanoi_2011.JPG",
        alt: name || "Hoàng Thành Thăng Long",
        diaDanh: "Di sản Hà Nội",
        tacGia: "Gryffindor",
        nguon: "Wikimedia Commons",
        giayPhep: "CC BY-SA 3.0",
      },
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hoan_Kiem_Lake_Hanoi_Vietnam.JPG/960px-Hoan_Kiem_Lake_Hanoi_Vietnam.JPG",
        urlThumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hoan_Kiem_Lake_Hanoi_Vietnam.JPG/960px-Hoan_Kiem_Lake_Hanoi_Vietnam.JPG",
        alt: name || "Hồ Hoàn Kiếm Hà Nội",
        diaDanh: "Thủ đô Hà Nội",
        tacGia: "Gryffindor",
        nguon: "Wikimedia Commons",
        giayPhep: "CC BY-SA 3.0",
      },
    ];
    return pickFromPool(HANOI_EXP, name);
  }

  return getActivityImage(type, name);
}

/** Lấy ảnh đầy đủ cho thẻ VenueCard trên các trang công khai */
export function getVenueImage(place: {
  name: string;
  city?: string;
  type?: string;
  group?: string;
  accommodationStars?: number | null;
  cuisine?: string | null;
}): ImageInfo {
  if (place.group === "accommodation") {
    return getHotelImage(place.accommodationStars, place.name, place.city);
  }
  if (place.group === "dining") {
    return getRestaurantImage(place.name, place.cuisine);
  }
  if (place.group === "cafe") {
    return getCafeImage(place.name);
  }
  return getExperienceImage(place.name, place.city, place.type);
}
