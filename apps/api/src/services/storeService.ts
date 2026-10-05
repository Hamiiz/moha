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

export interface InstructorSettings {
  baseLat:     number;
  baseLng:     number;
  baseAddress: string;
  weeklySchedule: DaySchedule[];
}

let settings: InstructorSettings = {
  baseLat:     43.6416,
  baseLng:     -79.4172,
  baseAddress: "1002 King Street West, Toronto, ON M6K 1J7",
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
  { id: "hub-1", name: "Scarborough Town Centre",    address: "300 Borough Dr, Scarborough, ON",    lat: 43.7764, lng: -79.2318 },
  { id: "hub-2", name: "Mississauga City Centre",    address: "100 City Centre Dr, Mississauga, ON",lat: 43.5890, lng: -79.6441 },
  { id: "hub-3", name: "Vaughan Metropolitan Centre",address: "3080 Rutherford Rd, Vaughan, ON",    lat: 43.7935, lng: -79.5277 },
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

import fs from "node:fs";
import path from "node:path";
import { logger } from "../utils/logger.js";

const DATA_DIR = path.resolve(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

interface PersistedState {
  settings: InstructorSettings;
  pickupHubs: PickupHubItem[];
  packages: LessonPackageItem[];
}

function loadState(): void {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed.settings) settings = parsed.settings;
      if (parsed.pickupHubs) pickupHubs = parsed.pickupHubs;
      if (parsed.packages) packages = parsed.packages;
      logger.info({ path: STORE_FILE }, "Loaded persisted instructor settings from disk");
    } else {
      saveState();
    }
  } catch (err) {
    logger.error({ err }, "Failed to load store.json from disk, using defaults");
  }
}

function saveState(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data: PersistedState = { settings, pickupHubs, packages };
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
    logger.debug({ path: STORE_FILE }, "Saved store.json to disk");
  } catch (err) {
    logger.error({ err }, "Failed to write store.json to disk");
  }
}

// Initialize & load from disk at startup
loadState();

export function getSettings(): InstructorSettings {
  return { ...settings };
}

export function updateSettings(updates: Partial<InstructorSettings>): InstructorSettings {
  settings = { ...settings, ...updates };
  saveState();
  return getSettings();
}

export function updateWeeklySchedule(schedule: DaySchedule[]): DaySchedule[] {
  settings.weeklySchedule = schedule;
  saveState();
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
  saveState();
  return newItem;
}

export function deletePickupHub(id: string): boolean {
  const initialLength = pickupHubs.length;
  pickupHubs = pickupHubs.filter((h) => h.id !== id);
  const deleted = pickupHubs.length < initialLength;
  if (deleted) saveState();
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
  saveState();
  return newItem;
}

export function updatePackage(id: string, updates: Partial<Omit<LessonPackageItem, "id">>): LessonPackageItem | null {
  const index = packages.findIndex((p) => p.id === id);
  if (index === -1) return null;
  packages[index] = { ...packages[index]!, ...updates };
  saveState();
  return packages[index]!;
}

export function deletePackage(id: string): boolean {
  const initialLength = packages.length;
  packages = packages.filter((p) => p.id !== id);
  const deleted = packages.length < initialLength;
  if (deleted) saveState();
  return deleted;
}
