"use client";
import type { Screen } from "@/ui/context/AppContext";
import Link from "next/link";
import type {User} from "@/contracts";
import {AccountLinks} from "./AccountLinks";
import { Mountain } from "lucide-react";
import { PublicAccountLinks } from "@/ui/screens/PublicAccountLinks";
import { PublicNav } from "./PublicNav";
import { publicTheme } from "./publicTheme";
import styles from "./Public.module.css";
export interface SiteHeaderProps {
    account?:User|null;
    onPlannerScreen?: (screen: Screen) => void;
    onNavigatePlan?: () => void;
}
export function SiteHeader({ onNavigatePlan,account,onPlannerScreen }: SiteHeaderProps) { return <div className={styles.headerWrap} style={publicTheme}><header className={styles.header}><Link className={styles.brand} href="/"><Mountain size={36}/><span><strong>Trip Vibes</strong><small>Mỗi hành trình, một câu chuyện</small></span></Link><PublicNav onNavigatePlan={onNavigatePlan} onPlannerScreen={onPlannerScreen}/>{account!==undefined?<AccountLinks user={account} onPlannerScreen={onPlannerScreen}/>:<PublicAccountLinks />}</header></div>; }
