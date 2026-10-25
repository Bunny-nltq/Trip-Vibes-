import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  UserSchema,
  SavedTripSchema,
  schemaVersion,
  type User,
  type SavedTrip,
  type Plan,
  type Ledger,
} from "@/contracts";

interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

const AUTH_DIR = path.join(process.cwd(), ".cache", "auth");
const USERS_FILE = path.join(AUTH_DIR, "users.json");
const TRIPS_FILE = path.join(AUTH_DIR, "trips.json");

function ensureDirectory() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
}

// In-memory fallback if file system is restricted
const memUsers: Map<string, StoredUser> = new Map();
const memTrips: Map<string, SavedTrip> = new Map();

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 32, "sha256").toString("hex");
}

function getInitialUsers(): StoredUser[] {
  const demoSalt = "4a8e8b3c9d1e2f3a4b5c6d7e8f9a0b1c";
  const demoHash = hashPassword("123456", demoSalt);
  return [
    {
      id: "usr_demo_tripvibes",
      name: "Nguyễn Du Khách",
      email: "khachhang@tripvibes.vn",
      createdAt: "2026-10-20T08:00:00.000Z",
      passwordHash: demoHash,
      salt: demoSalt,
    },
  ];
}

function getInitialTrips(): SavedTrip[] {
  try {
    const mauPath = path.join(process.cwd(), "src/data/mau/da-nang-3ngay.json");
    if (fs.existsSync(mauPath)) {
      const mauData = JSON.parse(fs.readFileSync(mauPath, "utf-8"));
      return [
        {
          schemaVersion,
          id: "trip_demo_danang_3n2d",
          userId: "usr_demo_tripvibes",
          title: "Chuyến đi Đà Nẵng (3N2Đ)",
          diemDi: "TP.HCM",
          diemDen: "Đà Nẵng",
          soNgay: 3,
          soNguoi: 2,
          nganSachDuKienVND: 10_000_000,
          tongChiPhiKeHoachVND: 8_379_600,
          tongChiTieuThucTeVND: 1_250_000,
          createdAt: "2026-10-21T09:00:00.000Z",
          updatedAt: "2026-10-23T18:00:00.000Z",
          plan: mauData.plan,
          ledger: {
            schemaVersion,
            expenses: [
              {
                id: "exp_demo_1",
                soTienVND: 450_000,
                hangMuc: "an_uong",
                tenCuaHang: "Hải sản Bé Mặn",
                ngay: "2026-10-21",
                ngayTrongChuyen: 1,
                nguon: "anh_bill",
                giaTriAIDoc: 450_000,
                daSuaTay: false,
                ghiChu: "Bữa trưa hải sản tươi sống",
              },
              {
                id: "exp_demo_2",
                soTienVND: 80_000,
                hangMuc: "an_uong",
                tenCuaHang: "Cộng Cà Phê",
                ngay: "2026-10-21",
                ngayTrongChuyen: 1,
                nguon: "nhap_tay",
                giaTriAIDoc: null,
                daSuaTay: false,
                ghiChu: "Cà phê cốt dừa",
              },
              {
                id: "exp_demo_3",
                soTienVND: 720_000,
                hangMuc: "vui_choi",
                tenCuaHang: "Bảo tàng Điêu khắc Chăm",
                ngay: "2026-10-22",
                ngayTrongChuyen: 2,
                nguon: "anh_bill",
                giaTriAIDoc: 720_000,
                daSuaTay: false,
                ghiChu: "Vé tham quan di sản",
              },
            ],
          },
          tickedPlaces: {
            "node_1": true,
            "node_2": true,
          },
        },
      ];
    }
  } catch {
    // ignore
  }
  return [];
}

function readUsers(): StoredUser[] {
  let list: StoredUser[] = [];
  try {
    ensureDirectory();
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }
  } catch {
    // fallback to memory
  }
  if (list.length === 0 && memUsers.size > 0) {
    list = Array.from(memUsers.values());
  }

  const demoUsers = getInitialUsers();
  let modified = false;
  for (const demo of demoUsers) {
    const idx = list.findIndex((u) => u.email.toLowerCase() === demo.email.toLowerCase());
    if (idx === -1) {
      list.unshift(demo);
      modified = true;
    } else if (list[idx].passwordHash !== demo.passwordHash) {
      list[idx] = demo;
      modified = true;
    }
  }

  if (modified || list.length === 0) {
    writeUsers(list);
  }
  return list;
}

function writeUsers(users: StoredUser[]): void {
  try {
    ensureDirectory();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch {
    // fallback to memory
  }
  memUsers.clear();
  for (const u of users) {
    memUsers.set(u.id, u);
  }
}

function readTrips(): SavedTrip[] {
  let list: SavedTrip[] = [];
  try {
    ensureDirectory();
    if (fs.existsSync(TRIPS_FILE)) {
      const raw = fs.readFileSync(TRIPS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }
  } catch {
    // fallback to memory
  }
  if (list.length === 0 && memTrips.size > 0) {
    list = Array.from(memTrips.values());
  }

  const initialTrips = getInitialTrips();
  let modified = false;
  for (const trip of initialTrips) {
    const exists = list.some((t) => t.id === trip.id);
    if (!exists) {
      list.unshift(trip);
      modified = true;
    }
  }

  if (modified || list.length === 0) {
    writeTrips(list);
  }
  return list;
}

function writeTrips(trips: SavedTrip[]): void {
  try {
    ensureDirectory();
    fs.writeFileSync(TRIPS_FILE, JSON.stringify(trips, null, 2), "utf-8");
  } catch {
    // fallback to memory
  }
  memTrips.clear();
  for (const t of trips) {
    memTrips.set(t.id, t);
  }
}

export function registerUser(name: string, email: string, password: string): {
  ok: true;
  user: User;
} | {
  ok: false;
  error: string;
} {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName) {
    return { ok: false, error: "Vui lòng nhập họ và tên." };
  }
  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { ok: false, error: "Email không đúng định dạng." };
  }
  if (!password || password.length < 6) {
    return { ok: false, error: "Mật khẩu phải có ít nhất 6 ký tự." };
  }

  const users = readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);
  if (existing) {
    return { ok: false, error: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác." };
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);

  const newUser: StoredUser = {
    id: `usr_${crypto.randomUUID()}`,
    name: trimmedName,
    email: trimmedEmail,
    createdAt: new Date().toISOString(),
    passwordHash,
    salt,
  };

  users.push(newUser);
  writeUsers(users);

  const safeUser: User = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    createdAt: newUser.createdAt,
  };

  return { ok: true, user: safeUser };
}

export function loginUser(email: string, password: string): {
  ok: true;
  user: User;
} | {
  ok: false;
  error: string;
} {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !password) {
    return { ok: false, error: "Vui lòng nhập email và mật khẩu." };
  }

  const users = readUsers();
  const user = users.find((u) => u.email.toLowerCase() === trimmedEmail);
  if (!user) {
    return { ok: false, error: "Tài khoản hoặc mật khẩu không chính xác." };
  }

  const inputHash = hashPassword(password, user.salt);
  if (inputHash !== user.passwordHash) {
    return { ok: false, error: "Tài khoản hoặc mật khẩu không chính xác." };
  }

  const safeUser: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };

  return { ok: true, user: safeUser };
}

export function getUserById(id: string): User | null {
  const users = readUsers();
  const found = users.find((u) => u.id === id);
  if (!found) return null;
  return {
    id: found.id,
    name: found.name,
    email: found.email,
    createdAt: found.createdAt,
  };
}

export function getUserTrips(userId: string): SavedTrip[] {
  const allTrips = readTrips();
  return allTrips
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function saveUserTrip(input: {
  userId: string;
  title?: string;
  plan: Plan;
  ledger: Ledger;
  tickedPlaces?: Record<string, boolean>;
}): SavedTrip {
  const trips = readTrips();

  const diemDenTen =
    typeof input.plan.request.diemDen === "string"
      ? input.plan.request.diemDen
      : input.plan.request.diemDen?.ten || "Điểm đến";

  const diemDiTen =
    typeof input.plan.request.diemDi === "string"
      ? input.plan.request.diemDi
      : input.plan.request.diemDi?.ten || "Điểm khởi hành";

  const totalActual = (input.ledger.expenses || []).reduce(
    (sum, exp) => sum + (exp.soTienVND || 0),
    0
  );

  const title =
    input.title ||
    `Chuyến đi ${diemDenTen} (${input.plan.request.soNgay || 3}N${Math.max(1, (input.plan.request.soNgay || 3) - 1)}Đ)`;

  const newTrip: SavedTrip = {
    schemaVersion,
    id: `trip_${crypto.randomUUID()}`,
    userId: input.userId,
    title,
    diemDi: diemDiTen,
    diemDen: diemDenTen,
    soNgay: input.plan.request.soNgay || 3,
    soNguoi: input.plan.request.soNguoi || 2,
    nganSachDuKienVND: input.plan.request.ngansachTongVND || 0,
    tongChiPhiKeHoachVND: input.plan.tongKet?.tongVND || 0,
    tongChiTieuThucTeVND: totalActual,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    plan: input.plan,
    ledger: input.ledger,
    tickedPlaces: input.tickedPlaces || {},
  };

  trips.push(newTrip);
  writeTrips(trips);

  return newTrip;
}

export function deleteUserTrip(userId: string, tripId: string): boolean {
  const trips = readTrips();
  const nextTrips = trips.filter((t) => !(t.id === tripId && t.userId === userId));
  if (nextTrips.length !== trips.length) {
    writeTrips(nextTrips);
    return true;
  }
  return false;
}

export function updateUserTrip(
  userId: string,
  tripId: string,
  updates: {
    title?: string;
    ledger?: Ledger;
    tickedPlaces?: Record<string, boolean>;
    plan?: Plan;
  }
): SavedTrip | null {
  const trips = readTrips();
  const index = trips.findIndex((t) => t.id === tripId && t.userId === userId);
  if (index === -1) return null;

  const current = trips[index];
  const nextPlan = updates.plan || current.plan;
  const nextLedger = updates.ledger || current.ledger;
  const nextTicked = updates.tickedPlaces !== undefined ? updates.tickedPlaces : current.tickedPlaces;
  const nextTitle = updates.title || current.title;

  const totalActual = (nextLedger.expenses || []).reduce(
    (sum, exp) => sum + (exp.soTienVND || 0),
    0
  );

  const updatedTrip: SavedTrip = {
    ...current,
    title: nextTitle,
    plan: nextPlan,
    ledger: nextLedger,
    tickedPlaces: nextTicked,
    tongChiPhiKeHoachVND: nextPlan.tongKet?.tongVND || current.tongChiPhiKeHoachVND,
    tongChiTieuThucTeVND: totalActual,
    updatedAt: new Date().toISOString(),
  };

  trips[index] = updatedTrip;
  writeTrips(trips);
  return updatedTrip;
}

