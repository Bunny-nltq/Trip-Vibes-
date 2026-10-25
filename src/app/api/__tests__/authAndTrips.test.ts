import { describe, it, expect, beforeEach } from "vitest";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { GET as meHandler } from "@/app/api/auth/me/route";
import {
  GET as getTripsHandler,
  POST as saveTripHandler,
  PUT as updateTripHandler,
  DELETE as deleteTripHandler,
} from "@/app/api/user/trips/route";
import { DEFAULT_SAMPLE_PLAN } from "@/ui/context/AppContext";
import { createLedger } from "@/core/ledger";

function createJsonRequest(url: string, method: string, body?: any, headers?: Record<string, string>): Request {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Auth and Saved Trips API Tests", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPass = "MatKhau123!";
  const testName = "Nguyễn Văn Test";
  let createdUserId = "";

  it("1. Register: rejects invalid or short password", async () => {
    const req = createJsonRequest("http://localhost:3000/api/auth/register", "POST", {
      ten: "Test",
      email: "invalid_email",
      matKhau: "123",
    });
    const res = await registerHandler(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.thanhCong).toBe(false);
  });

  it("2. Register: successfully creates a new user and does not leak password", async () => {
    const req = createJsonRequest("http://localhost:3000/api/auth/register", "POST", {
      ten: testName,
      email: testEmail,
      matKhau: testPass,
    });
    const res = await registerHandler(req as any);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.thanhCong).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.id).toBeDefined();
    expect(data.user.email).toBe(testEmail.toLowerCase());
    expect(data.user.name).toBe(testName);
    expect(data.user.matKhau).toBeUndefined();
    expect(data.user.salt).toBeUndefined();
    createdUserId = data.user.id;
  });

  it("3. Register: rejects duplicate email", async () => {
    const req = createJsonRequest("http://localhost:3000/api/auth/register", "POST", {
      ten: "Duplicate User",
      email: testEmail,
      matKhau: testPass,
    });
    const res = await registerHandler(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.thanhCong).toBe(false);
    expect(data.thongDiep).toContain("đã được sử dụng");
  });

  it("4. Login: fails with wrong password", async () => {
    const req = createJsonRequest("http://localhost:3000/api/auth/login", "POST", {
      email: testEmail,
      matKhau: "WrongPassword!",
    });
    const res = await loginHandler(req as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.thanhCong).toBe(false);
  });

  it("5. Login: fails with non-existent email", async () => {
    const req = createJsonRequest("http://localhost:3000/api/auth/login", "POST", {
      email: "does_not_exist_999@example.com",
      matKhau: "AnyPassword123!",
    });
    const res = await loginHandler(req as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.thanhCong).toBe(false);
  });

  it("6. Login: succeeds with correct credentials", async () => {
    const req = createJsonRequest("http://localhost:3000/api/auth/login", "POST", {
      email: testEmail,
      matKhau: testPass,
    });
    const res = await loginHandler(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.thanhCong).toBe(true);
    expect(data.user.id).toBe(createdUserId);
    expect(data.user.email).toBe(testEmail.toLowerCase());
  });

  it("7. Me endpoint: returns current user by userId header or param", async () => {
    const req = createJsonRequest(`http://localhost:3000/api/auth/me?userId=${createdUserId}`, "GET");
    const res = await meHandler(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.thanhCong).toBe(true);
    expect(data.user.id).toBe(createdUserId);
  });

  let savedTripId = "";

  it("8. User Trips: saves trip for registered user", async () => {
    const sampleTrip = {
      userId: createdUserId,
      title: "Hà Nội → Đà Nẵng (3 ngày)",
      diemDi: "Hà Nội",
      diemDen: "Đà Nẵng",
      soNgay: 3,
      soNguoi: 2,
      nganSachDuKienVND: 10000000,
      tongChiPhiKeHoachVND: 9540000,
      tongChiTieuThucTeVND: 500000,
      plan: DEFAULT_SAMPLE_PLAN,
      ledger: createLedger(),
      tickedPlaces: { "act-bien": true },
    };

    const req = createJsonRequest("http://localhost:3000/api/user/trips", "POST", { trip: sampleTrip });
    const res = await saveTripHandler(req as any);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.thanhCong).toBe(true);
    expect(data.trip.id).toBeDefined();
    expect(data.trip.title).toBe("Hà Nội → Đà Nẵng (3 ngày)");
    expect(data.trip.tickedPlaces["act-bien"]).toBe(true);
    savedTripId = data.trip.id;
  });

  it("9. User Trips: lists saved trips for registered user", async () => {
    const req = createJsonRequest(`http://localhost:3000/api/user/trips?userId=${createdUserId}`, "GET");
    const res = await getTripsHandler(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.thanhCong).toBe(true);
    expect(Array.isArray(data.trips)).toBe(true);
    expect(data.trips.length).toBeGreaterThanOrEqual(1);
    expect(data.trips.some((t: any) => t.id === savedTripId)).toBe(true);
  });

  it("10. User Trips: updates trip title and ticked places with PUT", async () => {
    const updateReq = createJsonRequest(
      "http://localhost:3000/api/user/trips",
      "PUT",
      {
        userId: createdUserId,
        id: savedTripId,
        title: "Kỳ nghỉ hè tuyệt vời tại Đà Nẵng",
        tickedPlaces: { "act-bien": true, "hotel-002": true },
      }
    );
    const updateRes = await updateTripHandler(updateReq as any);
    expect(updateRes.status).toBe(200);
    const data = await updateRes.json();
    expect(data.thanhCong).toBe(true);
    expect(data.trip.title).toBe("Kỳ nghỉ hè tuyệt vời tại Đà Nẵng");
    expect(data.trip.tickedPlaces["hotel-002"]).toBe(true);
  });

  it("11. User Trips: deletes saved trip", async () => {
    const req = createJsonRequest(
      `http://localhost:3000/api/user/trips?id=${savedTripId}&userId=${createdUserId}`,
      "DELETE"
    );
    const res = await deleteTripHandler(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.thanhCong).toBe(true);

    // Verify deletion
    const verifyReq = createJsonRequest(`http://localhost:3000/api/user/trips?userId=${createdUserId}`, "GET");
    const verifyRes = await getTripsHandler(verifyReq as any);
    const verifyData = await verifyRes.json();
    expect(verifyData.trips.some((t: any) => t.id === savedTripId)).toBe(false);
  });
});
