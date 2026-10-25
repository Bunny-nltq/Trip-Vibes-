import { describe, it, expect } from "vitest";
import {
  loginUser,
  registerUser,
  getUserById,
  getUserTrips,
  saveUserTrip,
  deleteUserTrip,
} from "./authStore";
import { PlanSchema } from "@/contracts";

describe("Hệ thống Xác thực & Quản lý Nhật ký chuyến đi (Auth & Trips Store)", () => {
  it("cho phép đăng nhập bằng tài khoản mẫu đã tạo sẵn (khachhang@tripvibes.vn / 123456)", () => {
    const result = loginUser("khachhang@tripvibes.vn", "123456");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("khachhang@tripvibes.vn");
    expect(result.user.name).toBe("Nguyễn Du Khách");
    expect((result.user as any).passwordHash).toBeUndefined();
    expect((result.user as any).salt).toBeUndefined();
  });

  it("từ chối đăng nhập khi sai mật khẩu", () => {
    const result = loginUser("khachhang@tripvibes.vn", "sai_mat_khau");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("Tài khoản hoặc mật khẩu không chính xác");
  });

  it("từ chối đăng nhập khi email không tồn tại", () => {
    const result = loginUser("khongton_tai@example.com", "123456");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("Tài khoản hoặc mật khẩu không chính xác");
  });

  it("cho phép đăng ký tài khoản mới và đăng nhập bằng tài khoản vừa tạo", () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const regResult = registerUser("Người Dùng Test", testEmail, "MatKhau123");

    expect(regResult.ok).toBe(true);
    if (!regResult.ok) return;
    expect(regResult.user).toBeDefined();
    expect(regResult.user.name).toBe("Người Dùng Test");
    expect(regResult.user.email).toBe(testEmail);

    // Thử đăng nhập lại với mật khẩu mới
    const loginResult = loginUser(testEmail, "MatKhau123");
    expect(loginResult.ok).toBe(true);
    if (!loginResult.ok) return;
    expect(loginResult.user.id).toBe(regResult.user.id);
  });

  it("từ chối đăng ký khi email đã tồn tại", () => {
    const res = registerUser("Trùng lặp", "khachhang@tripvibes.vn", "123456");
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toContain("Email này đã được sử dụng");
  });

  it("từ chối đăng ký khi mật khẩu dưới 6 ký tự hoặc thông tin rỗng", () => {
    const resShortPass = registerUser("Họ Tên", "email_short@test.com", "123");
    expect(resShortPass.ok).toBe(false);
    if (!resShortPass.ok) {
      expect(resShortPass.error).toContain("Mật khẩu phải có ít nhất 6 ký tự");
    }

    const resEmptyName = registerUser("", "email_noname@test.com", "123456");
    expect(resEmptyName.ok).toBe(false);

    const resEmptyEmail = registerUser("Họ Tên", "", "123456");
    expect(resEmptyEmail.ok).toBe(false);
  });

  it("tài khoản demo có sẵn nhật ký chuyến đi mẫu Đà Nẵng", () => {
    const trips = getUserTrips("usr_demo_tripvibes");
    expect(trips.length).toBeGreaterThanOrEqual(1);
    const danangTrip = trips.find((t) => t.title.includes("Đà Nẵng"));
    expect(danangTrip).toBeDefined();
    expect(danangTrip?.ledger.expenses.length).toBeGreaterThan(0);
    expect(danangTrip?.plan.items.length).toBeGreaterThan(0);
  });

  it("cho phép lưu và xóa nhật ký chuyến đi của người dùng", () => {
    const demoTrip = getUserTrips("usr_demo_tripvibes")[0];
    expect(demoTrip).toBeDefined();

    // Lưu một chuyến đi mới
    const saved = saveUserTrip({
      userId: "usr_demo_tripvibes",
      title: "Chuyến đi Hà Nội Mùa Thu",
      plan: demoTrip.plan,
      ledger: { schemaVersion: 15, expenses: [] },
      tickedPlaces: { "place-1": true },
    });

    expect(saved.id).toBeDefined();
    expect(saved.title).toBe("Chuyến đi Hà Nội Mùa Thu");

    const updatedTrips = getUserTrips("usr_demo_tripvibes");
    expect(updatedTrips.some((t) => t.id === saved.id)).toBe(true);

    // Xóa chuyến đi vừa tạo
    const deleted = deleteUserTrip("usr_demo_tripvibes", saved.id);
    expect(deleted).toBe(true);

    const tripsAfterDelete = getUserTrips("usr_demo_tripvibes");
    expect(tripsAfterDelete.some((t) => t.id === saved.id)).toBe(false);
  });
});
