import { describe,it,expect } from "vitest";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { GET,POST,PUT,DELETE } from "@/app/api/user/trips/route";
import { PUT as profile } from "@/app/api/user/profile/route";
import { DEFAULT_SAMPLE_PLAN } from "@/testing/fixtures/samplePlan";
import { schemaVersion } from "@/contracts";
import { validOrigin } from "@/app/api/_auth";
const req=(path:string,method="GET",body?:unknown,cookie="",origin?:string)=>new Request(`http://localhost${path}`,{method,headers:{"Content-Type":"application/json",cookie,...(origin?{origin}:{})},body:body===undefined?undefined:JSON.stringify(body)});
const cookie=(response:Response)=>response.headers.get("set-cookie")!.split(";")[0];

describe("Authenticated trip API",()=>{
 it("accepts the actual loopback host while rejecting a different browser origin",()=>{
  const request = (origin: string, site = "same-origin") => new Request("http://localhost:3002/api/auth/register", {
    method: "POST",
    headers: { host: "127.0.0.1:3002", origin, "sec-fetch-site": site },
  });
  expect(validOrigin(request("http://127.0.0.1:3002"))).toBe(true);
  expect(validOrigin(request("http://127.0.0.1:3003"))).toBe(false);
  expect(validOrigin(request("http://127.0.0.1:3002", "cross-site"))).toBe(false);
 });
 it("rejects forged identities, validates JSON types and cross-site writes",async()=>{
  expect((await GET(req("/api/user/trips?userId=usr_demo_tripvibes"))).status).toBe(401);
  expect((await (await me(req("/api/auth/me?userId=usr_demo_tripvibes"))).json()).user).toBeNull();
  expect((await register(req("/api/auth/register","POST",{name:123,email:[],password:{}}))).status).toBe(400);
  expect((await login(req("/api/auth/login","POST",{email:123,password:123}))).status).toBe(400);
  expect((await register(req("/api/auth/register","POST",{},"","https://attacker.example"))).status).toBe(403);
 });
 it("registers, logs in, saves/completes trips, blocks other users and revokes logout",async()=>{
  const first=await register(req("/api/auth/register","POST",{name:"Owner",email:"owner-api@example.com",password:"StrongPass123"}));expect(first.status).toBe(201);
  expect(first.headers.get("set-cookie")).toContain("HttpOnly");const ownerCookie=cookie(first);
  const second=await register(req("/api/auth/register","POST",{name:"Other",email:"other-api@example.com",password:"StrongPass123"}));const otherCookie=cookie(second);
  const owner=(await (await me(req("/api/auth/me","GET",undefined,ownerCookie))).json()).user;
  const saved=await POST(req("/api/user/trips","POST",{userId:"forged",title:"Trip",plan:DEFAULT_SAMPLE_PLAN,ledger:{schemaVersion,expenses:[]}},ownerCookie));expect(saved.status).toBe(201);const trip=(await saved.json()).trip;expect(trip.userId).toBe(owner.id);
  expect((await (await GET(req(`/api/user/trips?userId=${owner.id}`,"GET",undefined,otherCookie))).json()).trips).toEqual([]);
  expect((await PUT(req("/api/user/trips","PUT",{id:trip.id,version:1,title:"Attack"},otherCookie))).status).toBe(404);
  expect((await DELETE(req(`/api/user/trips?id=${trip.id}&userId=${owner.id}`,"DELETE",undefined,otherCookie))).status).toBe(404);
  const updated=await PUT(req("/api/user/trips","PUT",{id:trip.id,version:1,status:"completed",journal:"Wonderful"},ownerCookie));expect(updated.status).toBe(200);expect((await updated.json()).trip.status).toBe("completed");
  expect((await PUT(req("/api/user/trips","PUT",{id:trip.id,version:1,title:"Stale"},ownerCookie))).status).toBe(409);
  expect((await PUT(req("/api/user/trips","PUT",{id:trip.id,version:2,ledger:{expenses:[{soTienVND:-10}]}},ownerCookie))).status).toBe(400);
  expect((await profile(req("/api/user/profile","PUT",{birthDate:"2030-01-01"},ownerCookie))).status).toBe(400);
  expect((await profile(req("/api/user/profile","PUT",{gender:"undisclosed",interests:["cafe"],personalize:true},ownerCookie))).status).toBe(200);
  const signedIn=await login(req("/api/auth/login","POST",{email:"owner-api@example.com",password:"StrongPass123"}));expect(signedIn.status).toBe(200);const fresh=cookie(signedIn);
  expect((await logout(req("/api/auth/logout","POST",undefined,fresh))).status).toBe(200);expect((await GET(req("/api/user/trips","GET",undefined,fresh))).status).toBe(401);
  expect((await DELETE(req(`/api/user/trips?id=${trip.id}`,"DELETE",undefined,ownerCookie))).status).toBe(200);
 });
});
