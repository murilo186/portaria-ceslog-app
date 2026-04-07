import { env } from "../config/env";
import { getBusinessDateKey as getBusinessDateKeyFromDate } from "./date";

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

type SimulationRuntime = {
  enabled: boolean;
  startMinutes: number;
  startedAtMs: number;
  startedAtBusinessKey: string;
};

function parseSimulationStart(value: string): number {
  const normalized = value.trim();
  const match = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)$/);

  if (!match) {
    throw new Error("Horario invalido. Use HH:mm.");
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  return hours * 60 + minutes;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function addDaysToBusinessKey(key: string, dayOffset: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + dayOffset);
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(base.getUTCDate())}`;
}

const runtime: SimulationRuntime = {
  enabled: false,
  startMinutes: 0,
  startedAtMs: Date.now(),
  startedAtBusinessKey: getBusinessDateKeyFromDate(new Date()),
};

function setRuntimeSimulation(startMinutes: number) {
  runtime.enabled = true;
  runtime.startMinutes = startMinutes;
  runtime.startedAtMs = Date.now();
  runtime.startedAtBusinessKey = getBusinessDateKeyFromDate(new Date());
}

function setRuntimeRealClock() {
  runtime.enabled = false;
  runtime.startMinutes = 0;
  runtime.startedAtMs = Date.now();
  runtime.startedAtBusinessKey = getBusinessDateKeyFromDate(new Date());
}

(() => {
  const raw = env.CLOCK_SIMULATION_START?.trim();

  if (!raw) {
    setRuntimeRealClock();
    return;
  }

  try {
    const startMinutes = parseSimulationStart(raw);
    setRuntimeSimulation(startMinutes);
  } catch {
    console.warn(`[clock] invalid CLOCK_SIMULATION_START=\"${raw}\", fallback to real clock`);
    setRuntimeRealClock();
  }
})();

function getSimulatedClock() {
  const elapsedMs = Date.now() - runtime.startedAtMs;
  const totalMs = runtime.startMinutes * MS_PER_MINUTE + elapsedMs;
  const dayOffset = Math.floor(totalMs / MS_PER_DAY);
  const msOfDay = ((totalMs % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY;

  const hours = Math.floor(msOfDay / (60 * MS_PER_MINUTE));
  const minutes = Math.floor((msOfDay % (60 * MS_PER_MINUTE)) / MS_PER_MINUTE);
  const seconds = Math.floor((msOfDay % MS_PER_MINUTE) / MS_PER_SECOND);
  const milliseconds = msOfDay % MS_PER_SECOND;

  const msToMidnight = msOfDay === 0 ? 0 : MS_PER_DAY - msOfDay;
  const businessDateKey = addDaysToBusinessKey(runtime.startedAtBusinessKey, dayOffset);

  const now = new Date();
  now.setHours(hours, minutes, seconds, milliseconds);
  now.setDate(now.getDate() + dayOffset);

  return {
    now,
    businessDateKey,
    msOfDay,
    msToMidnight,
  };
}

function getRealClock() {
  const now = new Date();
  const msOfDay =
    now.getHours() * 60 * MS_PER_MINUTE +
    now.getMinutes() * MS_PER_MINUTE +
    now.getSeconds() * MS_PER_SECOND +
    now.getMilliseconds();
  const msToMidnight = msOfDay === 0 ? 0 : MS_PER_DAY - msOfDay;

  return {
    now,
    businessDateKey: getBusinessDateKeyFromDate(now),
    msOfDay,
    msToMidnight,
  };
}

function getClockState() {
  return runtime.enabled ? getSimulatedClock() : getRealClock();
}

export function setClockSimulationStart(start: string | null) {
  if (!start) {
    setRuntimeRealClock();
    return getReportClockSnapshot();
  }

  const startMinutes = parseSimulationStart(start);
  setRuntimeSimulation(startMinutes);
  return getReportClockSnapshot();
}

export function getCurrentDate() {
  return getClockState().now;
}

export function getCurrentBusinessDateKey() {
  return getClockState().businessDateKey;
}

export function getReportClockSnapshot() {
  const state = getClockState();
  const minutesToMidnight = Math.max(0, Math.ceil(state.msToMidnight / MS_PER_MINUTE));
  const showCountdown = state.msOfDay >= (23 * 60 + 55) * MS_PER_MINUTE;

  return {
    nowIso: state.now.toISOString(),
    businessDateKey: state.businessDateKey,
    msToMidnight: state.msToMidnight,
    minutesToMidnight,
    showCountdown,
    simulationEnabled: runtime.enabled,
    simulationStart: runtime.enabled
      ? `${pad2(Math.floor(runtime.startMinutes / 60))}:${pad2(runtime.startMinutes % 60)}`
      : null,
  };
}
