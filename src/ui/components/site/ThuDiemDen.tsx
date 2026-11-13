"use client";
import Image from "next/image";
import {getDestinationImage} from "@/ui/lib/imageMap";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import styles from "./Public.module.css";
export interface HinhAnhGhiCong {
    url: string;
    urlThumb?: string;
    alt?: string;
    diaDanh?: string;
    tacGia: string;
    nguon: string;
    giayPhep: string;
    linkGoc: string;
    linkGiayPhep?: string;
}
export interface DiemDenThe {
    id: string;
    slug: string;
    ten: string;
    quocGia: string;
    ngayDuLieuFormatted: string;
    moTaNgan?: string;
    hinhAnh?: HinhAnhGhiCong;
}
export interface ThuDiemDenProps {
    diemDens: DiemDenThe[];
}
export function ThuDiemDen({ diemDens }: ThuDiemDenProps) { return <div className={`${styles.grid} ${styles.destinations}`}>{diemDens.map(destination => <article key={destination.slug} className={styles.card}><div className={styles.photo}>{<Image src={getDestinationImage(destination.ten).urlThumb} alt={getDestinationImage(destination.ten).alt} onError={event=>{event.currentTarget.src=getDestinationImage().url;event.currentTarget.srcset="";}} fill sizes="(max-width:600px) 100vw, 400px" unoptimized/>}</div><div className={styles.body}><span className={styles.tag}><MapPin size={14}/>{destination.quocGia}</span><h3>{destination.ten}</h3><p className={styles.muted}>{destination.moTaNgan}</p><Link className={styles.link} href={`/diem-den/${destination.slug}`}>Khám phá {destination.ten}<ArrowRight size={16}/></Link></div></article>)}</div>; }
