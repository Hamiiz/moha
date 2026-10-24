import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const { Pool } = pg;

export interface PickupHubItem {
  id:      string;
  name:    string;
  address: string;
  lat:     number;
  lng:     number;
}

export interface DaySchedule {
  day:       "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  label:     string;
  startHour: number;
  endHour:   number;
  isOff:     boolean;
}

export interface LessonPackageItem {
  id:          string;
  title:       string;
  description: string;
  basePrice:   number;
  badge?:      string;
}

export interface VehicleItem {
  id:          string;
  name:        string;        // e.g. "2023 Toyota Corolla"
  subtitle:    string;        // e.g. "Primary training vehicle"
  badgeText?:  string;        // e.g. "Most Popular", "DriveTest Ready"
  badgeIcon?:  string;        // e.g. "star", "verified"
  features:    string[];      // e.g. ["Automatic trans.", "Dual controls", "360° backup cam", "A/C + heated seats"]
}

export interface HourlyRates {
  g2:        number;
  g:         number;
  beginner:  number;
  refresher: number;
}

export interface InstructorSettings {
  phone:                 string;
  email:                 string;
  instructorName:        string;
  bannerNotice:          string;
  hourlyRates:           HourlyRates;
  bufferMinutes:         number;   // Travel buffer gap between lessons
  lessonDurationMinutes: number;   // Default 90
  baseAddress:           string;
  baseLat:               number;
  baseLng:               number;
  maxServiceRadiusKm:    number;
  surchargePerKm:        number;
  weeklySchedule:        DaySchedule[];
}

// Default initial state
let settings: InstructorSettings = {
  phone:                 "(647) 912-7040",
  email:                 "mohadriving@gmail.com",
  instructorName:        "Moha",
  bannerNotice:          "",
  hourlyRates: {
    g2:        55,
    g:         60,
    beginner:  50,
    refresher: 55,
  },
  bufferMinutes:         30,
  lessonDurationMinutes: 90,
  baseAddress:           "1002 King Street West, Toronto, ON M6K 1J7",
  baseLat:               43.6416,
  baseLng:               -79.4172,
  maxServiceRadiusKm:    25,
  surchargePerKm:        1.5,
  weeklySchedule: [
    { day: "mon", label: "Monday",    startHour: 9, endHour: 18, isOff: false },
    { day: "tue", label: "Tuesday",   startHour: 9, endHour: 18, isOff: false },
    { day: "wed", label: "Wednesday", startHour: 9, endHour: 18, isOff: false },
    { day: "thu", label: "Thursday",  startHour: 9, endHour: 18, isOff: false },
    { day: "fri", label: "Friday",    startHour: 9, endHour: 18, isOff: false },
    { day: "sat", label: "Saturday",  startHour: 9, endHour: 17, isOff: false },
    { day: "sun", label: "Sunday",    startHour: 10, endHour: 16, isOff: true },
  ],
};

let pickupHubs: PickupHubItem[] = [
  { id: "hub-1", name: "Kipling Transit Hub (Etobicoke)", address: "St. Albans Rd, Etobicoke, ON M9B 1A3", lat: 43.6372, lng: -79.5362 },
  { id: "hub-2", name: "High Park Station (Bloor West)", address: "Quebec Ave, Toronto, ON M6P 2V1",       lat: 43.6538, lng: -79.4668 },
  { id: "hub-3", name: "Downsview Park Transit Hub",     address: "Sheppard Ave W, North York, ON M3K 2B8", lat: 43.7534, lng: -79.4784 },
];

let packages: LessonPackageItem[] = [
  {
    id: "single",
    title: "Single 90-Minute Session",
    description: "Standard intensive single session. Great for skill refinement and parallel parking practice.",
    basePrice: 90,
  },
  {
    id: "pass5",
    title: "5-Lesson Value Package",
    description: "Complete package covering city driving, highway entry, and mock road test evaluations.",
    basePrice: 400,
    badge: "Save $50",
  },
  {
    id: "roadtest",
    title: "Road Test Warmup & Car Rental",
    description: "60-min pre-test warm up session plus instructor vehicle rental for your G2 / G road test.",
    basePrice: 150,
  },
];

let fleet: VehicleItem[] = [
  {
    id: "v-1",
    name: "2023 Toyota Corolla",
    subtitle: "Primary training vehicle",
    badgeText: "Most Popular",
    badgeIcon: "star",
    features: ["Automatic trans.", "Dual controls", "360° backup cam", "A/C + heated seats"],
  },
  {
    id: "v-2",
    name: "2022 Honda Civic",
    subtitle: "Secondary training vehicle",
    badgeText: "DriveTest Ready",
    badgeIcon: "verified",
    features: ["Automatic trans.", "Dual controls", "Blind spot sensors", "A/C + heated seats"],
  },
];

// ── Persistence Setup: PostgreSQL (Neon / Supabase) or Local JSON Fallback ────

const DATA_DIR = path.resolve(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

interface PersistedState {
  settings:   InstructorSettings;
  pickupHubs: PickupHubItem[];
  packages:   LessonPackageItem[];
  fleet:      VehicleItem[];
}

let pool: pg.Pool | null = null;

if (env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    });
    logger.info("Configured PostgreSQL connection pool for Neon / Supabase");
  } catch (err) {
    logger.error({ err }, "Failed to initialize PostgreSQL pool, falling back to local file");
  }
}

// Local JSON File Sync (Immediate backup)
function saveLocalDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data: PersistedState = { settings, pickupHubs, packages, fleet };
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
    logger.debug({ path: STORE_FILE }, "Saved store.json backup to disk");
  } catch (err) {
    logger.error({ err }, "Failed to write store.json backup to disk");
  }
}

function loadLocalDisk(): void {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed.settings) settings = { ...settings, ...parsed.settings };
      if (parsed.pickupHubs) pickupHubs = parsed.pickupHubs;
      if (parsed.packages) packages = parsed.packages;
      if (parsed.fleet) fleet = parsed.fleet;
      logger.info({ path: STORE_FILE }, "Loaded persisted state from local store.json");
    } else {
      saveLocalDisk();
    }
  } catch (err) {
    logger.error({ err }, "Failed to read local store.json, using defaults");
  }
}

// PostgreSQL Sync
async function initDb(): Promise<void> {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS moha_store (
        key VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Load from DB
    const res = await pool.query<{ key: string; data: any }>(
      "SELECT key, data FROM moha_store WHERE key IN ('settings', 'pickupHubs', 'packages', 'fleet')"
    );

    if (res.rows.length > 0) {
      for (const row of res.rows) {
        if (row.key === "settings" && row.data) settings = { ...settings, ...row.data };
        if (row.key === "pickupHubs" && Array.isArray(row.data)) pickupHubs = row.data;
        if (row.key === "packages" && Array.isArray(row.data)) packages = row.data;
        if (row.key === "fleet" && Array.isArray(row.data)) fleet = row.data;
      }
      logger.info("Successfully hydrated store from PostgreSQL (Neon/Supabase)");
      saveLocalDisk(); // Keep disk in sync
    } else {
      // Seed initial state into DB
      await saveKeyToDb("settings", settings);
      await saveKeyToDb("pickupHubs", pickupHubs);
      await saveKeyToDb("packages", packages);
      await saveKeyToDb("fleet", fleet);
      logger.info("Seeded initial store state into PostgreSQL (Neon/Supabase)");
    }
  } catch (err) {
    logger.error({ err }, "PostgreSQL initialization failed. Falling back to disk store");
  }
}

async function saveKeyToDb(key: string, data: any): Promise<void> {
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO moha_store (key, data, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE
       SET data = $2, updated_at = CURRENT_TIMESTAMP`,
      [key, JSON.stringify(data)]
    );
  } catch (err) {
    logger.error({ err, key }, "Failed to persist key to PostgreSQL");
  }
}

// Trigger state persistence whenever data updates
function persistAll(keys: ("settings" | "pickupHubs" | "packages" | "fleet")[] = ["settings", "pickupHubs", "packages", "fleet"]): void {
  saveLocalDisk();
  if (pool) {
    for (const key of keys) {
      if (key === "settings") saveKeyToDb("settings", settings);
      if (key === "pickupHubs") saveKeyToDb("pickupHubs", pickupHubs);
      if (key === "packages") saveKeyToDb("packages", packages);
      if (key === "fleet") saveKeyToDb("fleet", fleet);
    }
  }
}

// Initial bootstrap
loadLocalDisk();
if (pool) {
  initDb().catch((err) => logger.error({ err }, "Error running initDb"));
}

// ── Exported Methods ──────────────────────────────────────────────────────────

export function getSettings(): InstructorSettings {
  return { ...settings };
}

export function updateSettings(updates: Partial<InstructorSettings>): InstructorSettings {
  settings = {
    ...settings,
    ...updates,
    hourlyRates: {
      ...settings.hourlyRates,
      ...(updates.hourlyRates || {}),
    },
  };
  persistAll(["settings"]);
  return getSettings();
}

export function updateWeeklySchedule(schedule: DaySchedule[]): DaySchedule[] {
  settings.weeklySchedule = schedule;
  persistAll(["settings"]);
  return [...settings.weeklySchedule];
}

export function getPickupHubs(): PickupHubItem[] {
  return [...pickupHubs];
}

export function addPickupHub(hub: Omit<PickupHubItem, "id">): PickupHubItem {
  const newItem: PickupHubItem = {
    id: `hub-${Date.now()}`,
    ...hub,
  };
  pickupHubs.push(newItem);
  persistAll(["pickupHubs"]);
  return newItem;
}

export function deletePickupHub(id: string): boolean {
  const initialLength = pickupHubs.length;
  pickupHubs = pickupHubs.filter((h) => h.id !== id);
  const deleted = pickupHubs.length < initialLength;
  if (deleted) persistAll(["pickupHubs"]);
  return deleted;
}

export function getPackages(): LessonPackageItem[] {
  return [...packages];
}

export function addPackage(pkg: Omit<LessonPackageItem, "id">): LessonPackageItem {
  const newItem: LessonPackageItem = {
    id: `pkg-${Date.now()}`,
    ...pkg,
  };
  packages.push(newItem);
  persistAll(["packages"]);
  return newItem;
}

export function updatePackage(id: string, updates: Partial<Omit<LessonPackageItem, "id">>): LessonPackageItem | null {
  const index = packages.findIndex((p) => p.id === id);
  if (index === -1) return null;
  packages[index] = { ...packages[index]!, ...updates };
  persistAll(["packages"]);
  return packages[index]!;
}

export function deletePackage(id: string): boolean {
  const initialLength = packages.length;
  packages = packages.filter((p) => p.id !== id);
  const deleted = packages.length < initialLength;
  if (deleted) persistAll(["packages"]);
  return deleted;
}

export function getFleet(): VehicleItem[] {
  return [...fleet];
}

export function addVehicle(vehicle: Omit<VehicleItem, "id">): VehicleItem {
  const newItem: VehicleItem = {
    id: `v-${Date.now()}`,
    ...vehicle,
  };
  fleet.push(newItem);
  persistAll(["fleet"]);
  return newItem;
}

export function deleteVehicle(id: string): boolean {
  const initialLength = fleet.length;
  fleet = fleet.filter((v) => v.id !== id);
  const deleted = fleet.length < initialLength;
  if (deleted) persistAll(["fleet"]);
  return deleted;
}

export function updateVehicle(id: string, updates: Partial<Omit<VehicleItem, "id">>): VehicleItem | null {
  const index = fleet.findIndex((v) => v.id === id);
  if (index === -1) return null;
  fleet[index] = { ...fleet[index]!, ...updates };
  persistAll(["fleet"]);
  return fleet[index]!;
}
