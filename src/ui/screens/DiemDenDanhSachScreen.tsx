"use client";
import {SiteHeader} from "@/ui/components/site/SiteHeader";
import {SiteFooter} from "@/ui/components/site/SiteFooter";
import {ThuDiemDen,type DiemDenThe} from "@/ui/components/site/ThuDiemDen";
import { ExperienceCarousel } from "@/ui/components/site/ExperienceCarousel";
import {ExploreSection} from "./ExploreSection";
import {publicTheme} from "@/ui/components/site/publicTheme";
import styles from "@/ui/components/site/Public.module.css";
export interface DiemDenDanhSachScreenProps{diemDens:DiemDenThe[];ngayDuLieu?:string;}
export function DiemDenDanhSachScreen({ diemDens, ngayDuLieu }: DiemDenDanhSachScreenProps) {
    return (
        <div className={`${styles.page} ${styles.experiencePage}`} style={publicTheme}>
            <SiteHeader />
            <main id="main-content" className={styles.experienceMain}>
                <ExperienceCarousel />
                <ExploreSection />
                <section className={`${styles.section} ${styles.experienceIntro}`} aria-labelledby="experience-destinations">
                    <div className={styles.heading}>
                        <h2 id="experience-destinations">Khám phá theo điểm đến</h2>
                    </div>
                    <ThuDiemDen diemDens={diemDens.filter(d => !["bangkok", "seoul"].includes(d.id))} />
                </section>
            </main>
            <SiteFooter ngayDuLieu={ngayDuLieu} />
        </div>
    );
}
