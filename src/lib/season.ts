"use client";

import { useSyncExternalStore } from "react";

export type Season = "spring" | "summer" | "autumn" | "winter";
export type SeasonState = { season: Season; on: boolean };

/** 채팅 전송 시 부는 바람 이벤트 (계절 효과가 받아서 처리) */
export const WIND_EVENT = "aurora:season-wind";

const KEY = "aurora.season";
const DEFAULT: SeasonState = { season: "autumn", on: true };
const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

function load(): SeasonState {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (v && SEASONS.includes(v.season) && typeof v.on === "boolean") return v;
  } catch {
    // 저장소 접근 불가 시 기본값
  }
  return DEFAULT;
}

let state: SeasonState = typeof window === "undefined" ? DEFAULT : load();
const listeners = new Set<() => void>();

export function setSeasonState(patch: Partial<SeasonState>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 저장 불가 시 이번 방문 동안만 유지
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** 현재 계절 효과 상태 (서버 렌더는 기본값, 하이드레이션 뒤 저장값으로 갱신) */
export function useSeason() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => DEFAULT,
  );
}
