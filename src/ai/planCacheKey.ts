import crypto from "node:crypto";import type {TripRequest} from "@/contracts";
export function planCacheKey(request:TripRequest,candidateSignature:string,versions:{model:string;prompt:string;rules:string},repair:unknown=null){return crypto.createHash("sha256").update(JSON.stringify({request,candidateSignature,versions,repair})).digest("hex");}
