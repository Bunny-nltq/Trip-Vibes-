"use client";
import { usePublicAccount } from "@/ui/hooks/usePublicAccount";
import { AccountLinks } from "@/ui/components/site/AccountLinks";
export function PublicAccountLinks() { const user = usePublicAccount(); return <AccountLinks user={user}/>; }
