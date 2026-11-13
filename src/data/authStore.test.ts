import { describe,it,expect } from "vitest";
import { registerUser,loginUser,getUserById,getUserTrips,saveUserTrip,deleteUserTrip,createSession,sessionUser,revokeSession,updateUserTrip,TripConflict } from "./authStore";
import { closeDatabase } from "./database";
import { DEFAULT_SAMPLE_PLAN } from "@/testing/fixtures/samplePlan";
import { schemaVersion } from "@/contracts";

describe("SQLite auth/trips V2",()=>{
 it("does not seed public demo credentials",()=>{expect(loginUser("khachhang@tripvibes.vn","123456").ok).toBe(false);expect(getUserTrips("usr_demo_tripvibes")).toEqual([]);});
 it("validates credentials, normalizes email and omits password",()=>{
  expect(registerUser("","bad","123").ok).toBe(false);
  const a=registerUser("Alice","Alice@Example.com","StrongPass123");expect(a.ok).toBe(true);if(!a.ok)return;
  expect(a.user.email).toBe("alice@example.com");expect(a.user).not.toHaveProperty("passwordHash");expect(getUserById(a.user.id)).toEqual(a.user);
  expect(registerUser("Again","alice@example.com","StrongPass123").ok).toBe(false);
  expect(loginUser("alice@example.com","wrongpass").ok).toBe(false);expect(loginUser("ALICE@example.com","StrongPass123").ok).toBe(true);
 });
 it("stores only opaque session digests and revokes sessions",()=>{
  const a=registerUser("Session","session@example.com","StrongPass123");if(!a.ok)throw Error();
  const token=createSession(a.user.id);expect(sessionUser(token)?.id).toBe(a.user.id);expect(sessionUser("forged")).toBeNull();revokeSession(token);expect(sessionUser(token)).toBeNull();
 });
 it("persists across connections, enforces ownership and optimistic version",()=>{
  const a=registerUser("Owner","owner@example.com","StrongPass123");if(!a.ok)throw Error();
  const trip=saveUserTrip({userId:a.user.id,plan:DEFAULT_SAMPLE_PLAN,ledger:{schemaVersion,expenses:[]},status:"in_progress"});
  closeDatabase();expect(getUserTrips(a.user.id)[0].id).toBe(trip.id);expect(updateUserTrip("other",trip.id,{title:"attack"},1)).toBeNull();expect(deleteUserTrip("other",trip.id)).toBe(false);
  expect(updateUserTrip(a.user.id,trip.id,{status:"completed"},1)?.version).toBe(2);
  expect(()=>updateUserTrip(a.user.id,trip.id,{title:"old"},1)).toThrow(TripConflict);
  expect(deleteUserTrip(a.user.id,trip.id)).toBe(true);expect(getUserTrips(a.user.id)).toEqual([]);
 });
});
