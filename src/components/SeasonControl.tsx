"use client";

import { setSeasonState, useSeason, type Season } from "@/lib/season";
import { INK } from "@/lib/sprites";
import PixelSprite from "./PixelSprite";

const OPTIONS: { id: Season; label: string; rows: string[]; palette: Record<string, string> }[] = [
  { id: "spring", label: "봄 · 벚꽃", rows: [".x.x.", "xxxxx", ".xyx.", "xxxxx", ".x.x."], palette: { x: "#f7b6c8", y: "#f2b544" } },
  { id: "summer", label: "여름 · 비", rows: ["..x..", ".xxx.", "xxxxx", "xxhxx", ".xxx."], palette: { x: "#6fa8dc", h: "#dff0ff" } },
  { id: "autumn", label: "가을 · 낙엽", rows: ["..x..", "x.x.x", "xxxxx", ".xxx.", "..y.."], palette: { x: "#d9582c", y: INK } },
  { id: "winter", label: "겨울 · 눈", rows: ["x.x.x", ".xxx.", "xxxxx", ".xxx.", "x.x.x"], palette: { x: "#f5f7ff" } },
];

/** 계절 효과 선택 + 켜기/끄기. layout: 사이드바(세로) / 모바일 헤더(가로) */
export default function SeasonControl({ layout }: { layout: "sidebar" | "header" }) {
  const { season, on } = useSeason();
  const vertical = layout === "sidebar";

  return (
    <div className={`flex items-center gap-1 ${vertical ? "flex-col" : "flex-row"}`} role="group" aria-label="계절 효과">
      <div className={vertical ? "grid grid-cols-2 gap-0.5" : "flex gap-0.5"}>
        {OPTIONS.map((o) => {
          const active = on && season === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              aria-label={o.label}
              title={o.label}
              onClick={() => setSeasonState({ season: o.id, on: true })}
              className={`px-btn flex size-7 items-center justify-center ${active ? "bg-gold" : "bg-wood-dark hover:bg-wood"}`}
            >
              <PixelSprite rows={o.rows} palette={o.palette} scale={3} />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-pressed={on}
        onClick={() => setSeasonState({ on: !on })}
        className={`px-btn px-1.5 py-0.5 text-[10px] ${on ? "bg-cream" : "bg-wood-dark text-cream/70"}`}
      >
        효과 {on ? "ON" : "OFF"}
      </button>
    </div>
  );
}
