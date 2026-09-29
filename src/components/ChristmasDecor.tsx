"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mountains_of_Christmas } from "next/font/google";
import PixelSprite from "./PixelSprite";
import { INK } from "@/lib/sprites";

const xmasFont = Mountains_of_Christmas({ weight: "700", subsets: ["latin"], display: "swap" });

const BULB_COLORS = ["#e84a3c", "#f2c94c", "#4cbf6a", "#4f8fe0", "#f28ac0"];
const PX = 2; // 도트 1칸
/** 전구 (아래로 매달린 모양, 4x6) — k: 소켓, o: 외곽선, x: 색, h: 반짝임 */
const BULB = [".kk.", ".kk.", "oxxo", "xhxx", "xxxx", ".xx."];
/** 장식 공 (5x5) — o: 외곽선, x: 색, h: 반짝임 */
const BAUBLE = [".ooo.", "oxhxo", "oxxxo", "oxxxo", ".ooo."];
/** 솔잎 뭉치 (화환 질감) — d: 어두운 잎, g: 중간, l: 밝은 잎 */
const TUFTS = [
  [".g.l.", "gdgdg", ".dgd."],
  ["l.g..", "gdgdl", "..dg."],
  [".lg.g", "dgdg.", ".g.d."],
];
const GREENS: Record<string, string> = { d: "#1f4a2a", g: "#2f6f3a", l: "#58a85a" };


const GIFT = ["..oo..oo..", ".oyyooyyo.", "..oooooo..", "oooooooooo", "oxxxyyxxxo", "oxxxyyxxxo", "oxxxyyxxxo", "oxxxyyxxxo", "oooooooooo"];
const SACK = [
  ".....oo.....",
  "....oyyo....",
  ".....oo.....",
  "....oxxo....",
  "...oxxxxo...",
  "..oxxxxxxo..",
  ".oxxxhxxxxo.",
  ".oxxxxxxxxo.",
  "oxxxxxxxxxxo",
  "oxxxxxxxxxxo",
  ".oxxxxxxxxo.",
  "..oooooooo..",
];
const HOLLY = ["xx...xx", "xxx.xxx", ".xxrxx.", "..rrr..", "...r..."];

type Pt = { x: number; y: number };
type Seg = { a: Pt; c: Pt; b: Pt };
type Bulb = Pt & { rot: number; color: string; group: number };

const quad = (s: Seg, t: number): Pt => ({
  x: (1 - t) ** 2 * s.a.x + 2 * (1 - t) * t * s.c.x + t ** 2 * s.b.x,
  y: (1 - t) ** 2 * s.a.y + 2 * (1 - t) * t * s.c.y + t ** 2 * s.b.y,
});

/** 도트 그리드를 SVG rect로 (가운데 정렬) */
function Pixels({ rows, color, at, colors }: { rows: string[]; color?: string; at: Pt; colors: Record<string, string> }) {
  const w = rows[0].length * PX;
  const h = rows.length * PX;
  return (
    <>
      {rows.flatMap((row, r) =>
        [...row].map((ch, c) =>
          ch === "." ? null : (
            <rect
              key={`${r}-${c}`}
              x={Math.round(at.x - w / 2 + c * PX)}
              y={Math.round(at.y - h / 2 + r * PX)}
              width={PX}
              height={PX}
              fill={colors[ch] ?? color}
            />
          ),
        ),
      )}
    </>
  );
}

function BulbSprite({ b, glow }: { b: Bulb; glow: number }) {
  const w = BULB[0].length * PX;
  return (
    <g transform={`translate(${b.x} ${b.y}) rotate(${b.rot})`} className={b.group ? "animate-xmas-b" : "animate-xmas-a"}>
      {/* 은은한 불빛 */}
      <circle cx={0} cy={9} r={glow} fill={b.color} opacity={0.3} />
      {BULB.map((row, r) =>
        [...row].map((ch, c) =>
          ch === "." ? null : (
            <rect
              key={`${r}-${c}`}
              x={c * PX - w / 2}
              y={r * PX}
              width={PX}
              height={PX}
              fill={ch === "k" ? "#2b2b2b" : ch === "o" ? INK : ch === "h" ? "#ffffff" : b.color}
            />
          ),
        ),
      )}
    </g>
  );
}

type GarlandProps = {
  /** 한 구간 폭 / 처지는 깊이 / 윗변 높이(px, 음수면 테두리보다 위) */
  span?: number;
  sag?: number;
  topY?: number;
  /** 양옆 화환 길이 (부모 높이 대비) */
  sideRatio?: number;
  /** 구간마다 전구 개수 (0이면 전구 없음) */
  bulbsPerSpan?: number;
  /** 장식 공을 고리 몇 개마다 하나씩 달지 */
  baubleEvery?: number;
  /** 지정하면 둘레를 따라 이 개수만큼 고르게 달고 baubleColors를 번갈아 칠함 */
  baubleCount?: number;
  baubleColors?: string[];
  /** 전구 불빛 반경(px) — 작은 상자는 글자를 가리지 않게 작게 */
  glow?: number;
  /** 네 변을 모두 두름 (모든 변이 바깥쪽으로 처지고 전구도 바깥을 향함). topY는 테두리에서 떨어진 거리로 사용 */
  wrap?: boolean;
};

/** 부모(relative) 상자 둘레에 솔가지 화환 + 전구 + 장식 공 (크기는 부모를 재서 맞춤) */
export function XmasGarland({ span = 56, sag = 10, topY = -14, sideRatio = 0.7, bulbsPerSpan = 2, baubleEvery = 1, baubleCount, baubleColors = ["#f2c94c", "#e84a3c"], glow = 11, wrap = false }: GarlandProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;

  const scene = useMemo(() => {
    if (!w || !h) return null;
    const segs: { seg: Seg; side: "top" | "left" | "right" | "bottom" }[] = [];
    if (wrap) {
      // 네 변 두르기: 테두리에서 d만큼 바깥, 모든 변이 바깥쪽으로 처짐
      const d = -topY;
      const along = (len: number) => Math.max(1, Math.round(len / span));
      const nx = along(w + d * 2);
      const sw = (w + d * 2) / nx;
      for (let i = 0; i < nx; i++) {
        const x0 = -d + i * sw;
        segs.push({ side: "top", seg: { a: { x: x0, y: -d }, c: { x: x0 + sw / 2, y: -d - sag * 2 }, b: { x: x0 + sw, y: -d } } });
        segs.push({ side: "bottom", seg: { a: { x: x0, y: h + d }, c: { x: x0 + sw / 2, y: h + d + sag * 2 }, b: { x: x0 + sw, y: h + d } } });
      }
      const ny = along(h + d * 2);
      const sh = (h + d * 2) / ny;
      for (let i = 0; i < ny; i++) {
        const y0 = -d + i * sh;
        segs.push({ side: "left", seg: { a: { x: -d, y: y0 }, c: { x: -d - sag * 2, y: y0 + sh / 2 }, b: { x: -d, y: y0 + sh } } });
        segs.push({ side: "right", seg: { a: { x: w + d, y: y0 }, c: { x: w + d + sag * 2, y: y0 + sh / 2 }, b: { x: w + d, y: y0 + sh } } });
      }
    }
    // 윗변: 구간마다 아래로 처짐
    const spans = Math.max(2, Math.round((w - 16) / span));
    const spanW = (w - 16) / spans;
    for (let i = 0; !wrap && i < spans; i++) {
      const x0 = 8 + i * spanW;
      segs.push({ side: "top", seg: { a: { x: x0, y: topY }, c: { x: x0 + spanW / 2, y: topY + sag * 2 }, b: { x: x0 + spanW, y: topY } } });
    }
    // 양옆: 바깥쪽으로 처짐
    const sideLen = h * sideRatio;
    const sideSpans = Math.max(1, Math.round(sideLen / span));
    const sideH = sideLen / sideSpans;
    for (let i = 0; !wrap && i < sideSpans; i++) {
      const y0 = topY + i * sideH;
      segs.push({ side: "left", seg: { a: { x: 0, y: y0 }, c: { x: -sag * 2, y: y0 + sideH / 2 }, b: { x: 0, y: y0 + sideH } } });
      segs.push({ side: "right", seg: { a: { x: w, y: y0 }, c: { x: w + sag * 2, y: y0 + sideH / 2 }, b: { x: w, y: y0 + sideH } } });
    }

    // 화환 몸통: 굵은 짙은 초록 곡선
    const path = segs.map(({ seg: sg }) => `M ${sg.a.x} ${sg.a.y} Q ${sg.c.x} ${sg.c.y} ${sg.b.x} ${sg.b.y}`).join(" ");

    // 솔잎 뭉치: 곡선을 따라 촘촘히 (위치마다 모양 번갈아)
    const tufts: { at: Pt; rows: string[] }[] = [];
    let n = 0;
    for (const { seg } of segs) {
      const len = Math.hypot(seg.b.x - seg.a.x, seg.b.y - seg.a.y) * 1.15;
      const steps = Math.max(4, Math.round(len / 5));
      for (let k = 0; k < steps; k++) {
        const pt = quad(seg, k / steps);
        tufts.push({ at: { x: pt.x + ((n * 7) % 3) - 1, y: pt.y + ((n * 5) % 3) - 1 }, rows: TUFTS[n % TUFTS.length] });
        n++;
      }
    }

    // 전구: 구간마다 bulbsPerSpan개 / 장식 공: 고리 자리마다
    const bulbs: Bulb[] = [];
    const baubles: { at: Pt; color: string }[] = [];
    segs.forEach(({ seg, side }, i) => {
      // 두르기 모드의 윗변은 전구가 위(바깥)를 향함
      const rot = side === "top" ? (wrap ? 180 : 0) : side === "bottom" ? 0 : side === "left" ? 90 : -90;
      for (let j = 0; j < bulbsPerSpan; j++) {
        const pt = quad(seg, (j + 1) / (bulbsPerSpan + 1));
        bulbs.push({ ...pt, rot, color: BULB_COLORS[(i * bulbsPerSpan + j) % BULB_COLORS.length], group: (i + j) % 2 });
      }
      if (!baubleCount && i % baubleEvery === 0) baubles.push({ at: seg.b, color: baubleColors[(i / baubleEvery) % baubleColors.length] });
    });
    if (baubleCount) {
      // 고리 자리를 둘레 순서(가운데 기준 각도)로 정렬한 뒤 고르게 골라 색을 번갈아 칠함
      const hooks = segs.map(({ seg }) => seg.b).sort((p, q) => Math.atan2(p.y - h / 2, p.x - w / 2) - Math.atan2(q.y - h / 2, q.x - w / 2));
      for (let k = 0; k < Math.min(baubleCount, hooks.length); k++) {
        baubles.push({ at: hooks[Math.floor((k * hooks.length) / baubleCount)], color: baubleColors[k % baubleColors.length] });
      }
    }
    return { path, tufts, bulbs, baubles };
  }, [w, h, span, sag, topY, sideRatio, bulbsPerSpan, baubleEvery, baubleCount, baubleColors, wrap]);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0" aria-hidden="true">
      {scene && (
        <svg className="absolute left-0 top-0 overflow-visible" width={w} height={h} shapeRendering="crispEdges">
          <path d={scene.path} fill="none" stroke="#1a3a22" strokeWidth={9} strokeLinecap="round" shapeRendering="auto" />
          {scene.tufts.map((t, i) => (
            <Pixels key={i} rows={t.rows} at={t.at} colors={GREENS} />
          ))}
          {scene.baubles.map((b, i) => (
            <Pixels key={i} rows={BAUBLE} at={{ x: b.at.x, y: b.at.y + 5 }} color={b.color} colors={{ o: INK, h: "#ffffff" }} />
          ))}
          {scene.bulbs.map((b, i) => (
            <BulbSprite key={i} b={b} glow={glow} />
          ))}
        </svg>
      )}
    </div>
  );
}

/** 크리스마스 한정: 대화창 둘레 솔가지 화환 + 전구 + 장식 공, 모서리 선물, 위쪽 Merry Christmas */
export default function ChristmasDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      <XmasGarland />

      {/* 모서리 선물 — 왼쪽: 산타 보따리 + 상자, 오른쪽: 상자 두 개 */}
      <div className="absolute -top-10 left-2 flex items-end gap-0.5 short:-top-6">
        <PixelSprite rows={SACK} palette={{ o: INK, x: "#b8322a", y: "#f2c94c", h: "#e46b5e" }} scale={3} className="h-auto w-9 short:w-6" />
        <PixelSprite rows={GIFT} palette={{ o: INK, x: "#3f8a4a", y: "#f2c94c" }} scale={2} className="h-auto w-5 short:w-4" />
      </div>
      <div className="absolute -top-9 right-2 flex items-end gap-0.5 short:-top-5">
        <PixelSprite rows={GIFT} palette={{ o: INK, x: "#4f8fe0", y: "#e84a3c" }} scale={2} className="h-auto w-5 short:w-4" />
        <PixelSprite rows={GIFT} palette={{ o: INK, x: "#e84a3c", y: "#f2c94c" }} scale={3} className="h-auto w-[30px] short:w-5" />
      </div>

      {/* 위쪽 가운데 Merry Christmas */}
      <div className="absolute -top-8 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap short:-top-6">
        <PixelSprite rows={HOLLY} palette={{ x: "#2f7a3a", r: "#e84a3c" }} scale={3} />
        <span
          className={`${xmasFont.className} text-[22px] leading-none text-[#f2c94c] sm:text-[30px] short:text-[24px]`}
          style={{
            textShadow: "2px 0 0 #1e120a, -2px 0 0 #1e120a, 0 2px 0 #1e120a, 0 -2px 0 #1e120a, 2px 2px 0 #1e120a, -2px 2px 0 #1e120a, 0 0 12px rgb(232 74 60 / 0.6)",
          }}
        >
          Merry Christmas
        </span>
        <PixelSprite rows={HOLLY} palette={{ x: "#2f7a3a", r: "#e84a3c" }} scale={3} />
      </div>
    </div>
  );
}
