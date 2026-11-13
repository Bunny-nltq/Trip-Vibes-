"use client";
import { useEffect, useState } from "react";
import { accountRequest } from "./accountApi";
import type { User } from "@/contracts";
export function usePublicAccount() {
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => { let active = true; accountRequest("/api/auth/me").then(result => { if (active)
        setUser(result.user || null); }).catch(() => { }); return () => { active = false; }; }, []);
    return user;
}
