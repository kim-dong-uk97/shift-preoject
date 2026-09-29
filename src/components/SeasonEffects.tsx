"use client";

import { useEffect, useRef } from "react";
import { useSeason, WIND_EVENT, type Season } from "@/lib/season";

/* ------------------------------------------------------------------ */
/* 계절별 설정                                                          */
/* ------------------------------------------------------------------ */

const INK = "#1e120a";

type SpriteDef = { rows: string[]; colors: string[] };

/** 떨어져서 쌓이는 계절(봄·가을·겨울) 설정 */
type PileProfile = {
  type: "pile";
  px: number;
  sprites: SpriteDef[];
  /** 스프라이트의 o(외곽선)·h(하이라이트) 색 */
  outline: string;
  highlight: string;
  maxMoving: number;
  spawnMs: [number, number];
  vy: [number, number];
  terminal: number;
  amp: [number, number];
  /** 떨어지며 뒤집히는 간격(ms). 0이면 뒤집히지 않음 */
  flutterMs: [number, number];
  /** 착지했을 때 그냥 굴러가 버릴 확률 */
  rollRate: number;
  rollSpeed: [number, number];
  /** 구를 때 90도씩 회전 */
  tumble: boolean;
  maxPerBox: number;
  maxLayers: number;
  layerPx: number;
  /** 채팅 바람 한 번에 날아가는 개수 */
  blow: [number, number];
  /** 낱개 대신 상자 윗면에 이어진 덩어리(눈 덮개)로 쌓임. maxH: 최대 높이(px) */
  cap?: { maxH: number };
};

/** 여름 비 설정 */
type RainProfile = { type: "rain"; maxDrops: number; perSecond: number; vy: [number, number]; slant: number };

const MAPLE = ["....o....", "...oxo...", ".o.oxo.o.", "oxooxooxo", "oxxxhxxxo", ".oxxxxxo.", "..oxxxo..", "...ooo...", "....o...."];
const GINKGO = [".........", ".ooo.ooo.", "oxxxoxxxo", "oxxhxxxxo", ".oxxxxxo.", "..oxxxo..", "...oxo...", "....o....", "....o...."];
const PETAL = [".oo..", "oxxo.", "oxhxo", ".oxxo", "..oo."];
const PETAL_S = [".oo.", "oxxo", "oxho", ".oo."];
const FLAKE = [".x.", "xhx", ".x."];
const FLAKE_DOT = ["x"];
const FLAKE_SQ = ["xx", "xx"];

const PROFILES: Record<Season, PileProfile | RainProfile> = {
  autumn: {
    type: "pile",
    px: 2,
    sprites: [
      { rows: MAPLE, colors: ["#c0492f", "#d9582c", "#e07a2e"] },
      { rows: GINKGO, colors: ["#f2c94c", "#e9b73a"] },
    ],
    outline: INK,
    highlight: "#fff1c4",
    maxMoving: 9,
    spawnMs: [800, 1500],
    vy: [24, 40],
    terminal: 46,
    amp: [8, 20],
    flutterMs: [400, 800],
    rollRate: 0.22,
    rollSpeed: [30, 55],
    tumble: true,
    maxPerBox: 120,
    maxLayers: 7,
    layerPx: 4,
    blow: [18, 22],
  },
  spring: {
    type: "pile",
    px: 2,
    sprites: [
      { rows: PETAL, colors: ["#f7b6c8", "#f9c9d6", "#f4a3bb"] },
      { rows: PETAL_S, colors: ["#fbd3de", "#f7b6c8"] },
    ],
    outline: "#b8567a",
    highlight: "#fff0f4",
    maxMoving: 16,
    spawnMs: [350, 700],
    vy: [16, 28],
    terminal: 32,
    amp: [14, 30],
    flutterMs: [300, 600],
    rollRate: 0.25,
    rollSpeed: [25, 45],
    tumble: true,
    maxPerBox: 160,
    maxLayers: 4,
    layerPx: 3,
    blow: [18, 22],
  },
  winter: {
    type: "pile",
    px: 2,
    sprites: [
      { rows: FLAKE, colors: ["#f5f7ff", "#e4ecf7"] },
      { rows: FLAKE_DOT, colors: ["#f5f7ff", "#dfe8f5"] },
      { rows: FLAKE_SQ, colors: ["#f5f7ff", "#e8eef8"] },
    ],
    outline: INK,
    highlight: "#ffffff",
    maxMoving: 45,
    spawnMs: [90, 200],
    vy: [18, 34],
    terminal: 40,
    amp: [4, 14],
    flutterMs: [0, 0],
    rollRate: 0.04,
    rollSpeed: [15, 25],
    tumble: false,
    maxPerBox: 450,
    cap: { maxH: 16 },
    maxLayers: 5,
    layerPx: 2,
    blow: [20, 24],
  },
  summer: { type: "rain", maxDrops: 110, perSecond: 70, vy: [520, 680], slant: -50 },
};

/* ------------------------------------------------------------------ */
/* 공통 도구                                                            */
/* ------------------------------------------------------------------ */

const GUST_MS = 1800;
const GUST_FORCE = 140; // px/s
/** 봄·가을: 많이 쌓였을수록 바람에 더 많이 떨어짐 (기본 개수 + 쌓인 수 비례, 최대 개수) */
const BLOW_EXTRA_RATE = 0.15; // 쌓인 낱개 수 대비
const BLOW_MAX = 60;
/** 겨울: 바람 한 번에 쌓인 눈 중 날아가는 비율, 깎이는 데 걸리는 시간, 눈송이 하나당 깎인 양(px) */
const SNOW_BLOW_RATIO = 0.6;
const SNOW_SWEEP_MS = 1000;
const SNOW_PER_FLAKE = 10;
const SNOW_FLAKES_MAX = 90;
const EDGE = 6; // 이 거리 안쪽 가장자리에 떨어지면 굴러떨어짐
const SINK = 4; // 착지 시 윗면 테두리에 살짝 파묻히는 최대 정도
/** 작은 것(눈송이)은 덜 파묻혀야 보임 */
const sinkOf = (size: number) => Math.min(SINK, Math.round(size / 3));
/** 폭이 좁은 상자(뽑기 간판·BEST 제목판)는 잘 안 맞으니 일부를 그 위에서 떨어뜨림 */
const SMALL_PERCH_W = 200;
const SMALL_PERCH_RATE = 0.12;
/** 위 상자 뒤로 지나가 아래쪽 상자(BEST 도구·메뉴판 등)에 내려앉는 비율 */
const BEHIND_RATE = 0.4;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/** 90도씩 돌린 4방향 (정사각 스프라이트 기준) */
const rotate = (rows: string[]) => rows.map((_, r) => rows.map((row) => row[r]).reverse().join(""));
const rotations = (rows: string[]) => {
  const out = [rows];
  for (let i = 1; i < 4; i++) out.push(rotate(out[i - 1]));
  return out;
};

// 모양·색·방향별 스프라이트를 한 번만 그려 두고 재사용 (많이 쌓여도 가볍게)
const spriteCache = new Map<string, HTMLCanvasElement>();
function sprite(p: PileProfile, kind: number, color: string, rot: number) {
  const key = `${p.outline}|${kind}|${color}|${rot}|${p.sprites[kind].rows.join("")}`;
  let c = spriteCache.get(key);
  if (!c) {
    const rows = rotations(p.sprites[kind].rows)[rot];
    c = document.createElement("canvas");
    c.width = rows[0].length * p.px;
    c.height = rows.length * p.px;
    const sctx = c.getContext("2d")!;
    rows.forEach((row, r) =>
      [...row].forEach((ch, col) => {
        if (ch === ".") return;
        sctx.fillStyle = ch === "o" ? p.outline : ch === "h" ? p.highlight : color;
        sctx.fillRect(col * p.px, r * p.px, p.px, p.px);
      }),
    );
    spriteCache.set(key, c);
  }
  return c;
}

type Box = { left: number; right: number; top: number; bottom: number };

type Particle = {
  kind: number;
  size: number;
  color: string;
  x: number;
  y: number;
  vy: number;
  baseX: number;
  amp: number;
  phase: number;
  rot: number;
  rotAt: number;
  state: "fall" | "roll";
  box: number;
  dir: number;
  speed: number;
  rollLeft: number;
  lift: number;
  /** 바람에 받은 추가 가로 속도(px/s), 점점 줄어듦 */
  vx: number;
  /** 바람에 밀려 통통 튀며 굴러가는 중 */
  hop: boolean;
  /** 바람에 날려 떨어지는 중: 다른 상자(옆 액자 등)에 다시 내려앉지 않고 화면 밖까지 떨어짐 */
  blown?: boolean;
  /** 위 상자들 뒤로 지나가 내려앉을 상자 (-1: 없음, -2: 목표를 놓쳐 끝까지 뒤로 떨어짐) */
  behind: number;
};

/** 쌓인 것: 수명 없이 남아 있다가 바람에만 떨어짐 */
type Rest = { box: number; relX: number; lift: number; kind: number; size: number; color: string; rot: number };

type Drop = { x: number; y: number; len: number; vy: number };
type Splash = { x: number; y: number; vx: number; vy: number; life: number };

/* ------------------------------------------------------------------ */
/* 컴포넌트                                                             */
/* ------------------------------------------------------------------ */

/**
 * 계절 효과: 봄 벚꽃 / 여름 비 / 가을 낙엽 / 겨울 눈.
 * [data-leaf-perch] 상자를 장애물로 취급 (윗면에 쌓이거나 굴러떨어짐, 비는 튐).
 * 가로 범위: [data-leaf-bound="left"]의 오른쪽 ~ [data-leaf-bound="right"]의 왼쪽.
 * 채팅 바람(WIND_EVENT)이 불면 모든 상자 위에 쌓인 것이 골고루 몇 개씩 날아감.
 */
export default function SeasonEffects({ stageId }: { stageId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { season, on } = useSeason();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!on || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const profile = PROFILES[season];
    const moving: Particle[] = [];
    const resting: Rest[] = [];
    const drops: Drop[] = [];
    const splashes: Splash[] = [];
    let raf = 0;
    let last = performance.now();
    let nextSpawn = last + 300;
    let rainCarry = 0;
    let cw = 0;
    let ch = 0;
    let gustStart = -Infinity;
    // 바람은 가운데에서 양쪽 바깥으로 갈라져 붊 (이 x보다 왼쪽은 왼쪽으로, 오른쪽은 오른쪽으로)
    let windCenter = 0;
    const outward = (x: number) => (x < windCenter ? -1 : 1);
    let blowQueue: [number, Rest][] = [];

    // 눈 덮개: 상자별로 2px 칸마다 쌓인 높이
    const COL = 2;
    const caps = new Map<number, Float32Array>();
    // 바람에 쓸려 가는 눈: 상자별 남은 양과 깎는 속도
    let capSweeps: { b: number; side: -1 | 1; start: number; remaining: number; rate: number }[] = [];
    let sweepFlakeCarry = 0;
    let sweepFlakes = 0;
    const capOf = (b: number, box: Box) => {
      const cols = Math.max(1, Math.round((box.right - box.left) / COL));
      let arr = caps.get(b);
      if (!arr || arr.length !== cols) {
        // 상자 폭이 바뀌면 비율대로 옮겨 담음
        const next = new Float32Array(cols);
        if (arr) for (let i = 0; i < cols; i++) next[i] = arr[Math.floor((i / cols) * arr.length)];
        caps.set(b, next);
        arr = next;
      }
      return arr;
    };
    /** 가장자리는 낮고 가운데는 높게 → 둥그스름한 덮개 */
    const capMax = (p: PileProfile, i: number, cols: number) => Math.min(p.cap!.maxH, 2 + Math.min(i, cols - 1 - i) * 1.2);
    const capHeightAt = (b: number, box: Box, x: number) => {
      const arr = capOf(b, box);
      const i = Math.floor((x - box.left) / COL);
      return i >= 0 && i < arr.length ? arr[i] : 0;
    };
    const deposit = (p: PileProfile, b: number, box: Box, x: number, size: number) => {
      const arr = capOf(b, box);
      const c = Math.floor((x - box.left) / COL);
      const amt = Math.max(1.5, size);
      for (let d = -5; d <= 5; d++) {
        const i = c + d;
        if (i < 0 || i >= arr.length) continue;
        arr[i] = Math.min(capMax(p, i, arr.length), arr[i] + amt * (1 - Math.abs(d) / 6));
      }
    };
    /** 옆 칸보다 너무 높으면 흘러내려 봉긋한 덩어리가 됨 */
    const relax = (arr: Float32Array) => {
      for (let i = 0; i < arr.length - 1; i++) {
        const diff = arr[i] - arr[i + 1];
        if (Math.abs(diff) > 2) {
          const move = (Math.abs(diff) - 2) / 2;
          if (diff > 0) {
            arr[i] -= move;
            arr[i + 1] += move;
          } else {
            arr[i] += move;
            arr[i + 1] -= move;
          }
        }
      }
    };
    let streaks: { x: number; y: number; len: number; speed: number }[] = [];

    const spawnRange = () => {
      const stage = document.getElementById(stageId)?.getBoundingClientRect();
      const leftEl = document.querySelector<HTMLElement>('[data-leaf-bound="left"]');
      const rightEl = document.querySelector<HTMLElement>('[data-leaf-bound="right"]');
      let left = stage ? stage.left : 0;
      let right = stage ? stage.right : window.innerWidth;
      // 사이드바는 fixed라 offsetParent가 항상 null → 실제로 보이는지는 크기로 판단
      const lr = leftEl?.getBoundingClientRect();
      if (lr && lr.width > 0 && lr.height > 0) left = Math.min(left, lr.right + 8);
      if (rightEl && stage) {
        const r = rightEl.getBoundingClientRect();
        // 오른쪽 열이 가운데 옆에 나란히 있을 때만 그 앞까지 확장
        if (r.left > stage.right - 1) right = Math.max(right, r.left - 8);
      }
      return { left: Math.max(0, left), right: Math.min(window.innerWidth, right) };
    };

    const onWind = () => {
      const now = performance.now();
      gustStart = now;
      const range = spawnRange();
      windCenter = (range.left + range.right) / 2;
      const rects = [...document.querySelectorAll<HTMLElement>("[data-leaf-perch]")].map((el) => el.getBoundingClientRect());
      // 바람결: 보이는 상자마다 가운데에서 양쪽 바깥으로 퍼져 나감
      const visible = rects.filter((r) => r.bottom > 0 && r.top < window.innerHeight && r.width > 0);
      streaks = visible.flatMap((r) =>
        ([-1, 1] as const).flatMap((side) =>
          Array.from({ length: r.width > 400 ? 2 : 1 }, () => {
            const len = Math.min(rand(40, 90), r.width / 2);
            const mid = (r.left + r.right) / 2;
            return {
              x: side > 0 ? mid + rand(0, r.width / 6) : mid - len - rand(0, r.width / 6),
              y: r.top - rand(4, 30),
              len,
              speed: side * rand(520, 780),
            };
          }),
        ),
      );
      blowQueue = [];
      if (profile.type !== "pile") return;
      if (profile.cap) {
        // 상자마다 쌓인 눈의 60%를 양쪽 가장자리에서 절반씩 쓸어 냄
        capSweeps = [];
        sweepFlakeCarry = 0;
        sweepFlakes = 0;
        for (const [b, arr] of caps) {
          let total = 0;
          for (const h of arr) total += h;
          if (total < 4) continue;
          const half = (total * SNOW_BLOW_RATIO) / 2;
          const start = now + rand(0, 200);
          for (const side of [-1, 1] as const) capSweeps.push({ b, side, start, remaining: half, rate: half / (SNOW_SWEEP_MS / 1000) });
        }
        return;
      }
      // 모든 상자에서 골고루: 상자별로 양쪽 가장자리 중 가까운 쪽에 가까운 순으로 줄 세운 뒤 돌아가며 한 개씩
      const gap = (r: Rest) => Math.min(r.relX, rects[r.box].width - r.relX - r.size);
      const perBox = new Map<number, Rest[]>();
      for (const r of resting) {
        if (!rects[r.box]) continue;
        perBox.set(r.box, [...(perBox.get(r.box) ?? []), r]);
      }
      const queues = [...perBox.values()].map((list) => list.sort((a, b) => gap(a) - gap(b)));
      const count = Math.min(BLOW_MAX, Math.round(rand(profile.blow[0], profile.blow[1]) + resting.length * BLOW_EXTRA_RATE));
      for (let picked = 0; picked < count && queues.some((q) => q.length); ) {
        for (const q of queues) {
          if (picked >= count) break;
          const r = q.shift();
          if (!r) continue;
          blowQueue.push([now + rand(0, 700), r]);
          picked++;
        }
      }
    };
    window.addEventListener(WIND_EVENT, onWind);

    const liftAt = (p: PileProfile, boxIdx: number, relX: number, size: number) =>
      Math.min(resting.filter((r) => r.box === boxIdx && Math.abs(r.relX - relX) < size * 0.6).length, p.maxLayers) * p.layerPx;
    const boxFull = (p: PileProfile, boxIdx: number) => resting.filter((r) => r.box === boxIdx).length >= p.maxPerBox;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      const dpr = window.devicePixelRatio || 1;
      if (cw !== window.innerWidth || ch !== window.innerHeight) {
        cw = window.innerWidth;
        ch = window.innerHeight;
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, cw, ch);

      const boxes: Box[] = [...document.querySelectorAll<HTMLElement>("[data-leaf-perch]")].map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      });

      // 바람 세기: 불기 시작해 커졌다가 잦아듦
      const gp = (now - gustStart) / GUST_MS;
      // 세기만 담고, 방향은 위치에 따라 바깥쪽(outward)으로
      const wind = gp >= 0 && gp <= 1 ? Math.sin(Math.PI * gp) * GUST_FORCE : 0;

      if (profile.type === "rain") stepRain(profile, dt, boxes, wind);
      else stepPile(profile, now, t, dt, boxes, wind);

      // 바람결: 옅은 도트 선이 가로로 스쳐 지나감
      if (wind !== 0) {
        ctx.globalAlpha = Math.min(0.5, Math.abs(wind) / GUST_FORCE);
        ctx.fillStyle = "#f3e3c3";
        for (const s of streaks) {
          s.x += s.speed * dt;
          for (let d = 0; d < s.len; d += 6) ctx.fillRect(Math.round(s.x + d), Math.round(s.y), 4, 2);
        }
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(frame);
    };

    /* ---------- 여름: 비 ---------- */
    function stepRain(p: RainProfile, dt: number, boxes: Box[], wind: number) {
      const range = spawnRange();
      rainCarry += p.perSecond * dt;
      while (rainCarry >= 1 && drops.length < p.maxDrops) {
        rainCarry -= 1;
        drops.push({ x: rand(range.left, range.right + 120), y: rand(-60, -10), len: rand(8, 14), vy: rand(p.vy[0], p.vy[1]) });
      }
      rainCarry = Math.min(rainCarry, 1);
      ctx!.fillStyle = "#9fc3e8";
      ctx!.globalAlpha = 0.7;
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        const prevY = d.y + d.len;
        // 채팅 바람이 불면 위치에 따라 바깥쪽으로 더 기울어짐
        const vx = p.slant + wind * 1.6 * outward(d.x);
        d.y += d.vy * dt;
        d.x += vx * dt;
        const bottom = d.y + d.len;
        let hit = bottom > ch;
        for (const b of boxes) {
          if (d.x > b.left && d.x < b.right && prevY <= b.top && bottom >= b.top) {
            hit = true;
            // 윗면에 부딪혀 물방울이 튐
            for (let k = 0; k < 3; k++) splashes.push({ x: d.x, y: b.top - 2, vx: rand(-80, 80), vy: -rand(60, 130), life: 0.35 });
            break;
          }
        }
        if (hit) {
          drops.splice(i, 1);
          continue;
        }
        // 살짝 기울어진 도트 빗줄기
        const slope = vx / d.vy;
        for (let s = 0; s < d.len; s += 2) ctx!.fillRect(Math.round(d.x + slope * s), Math.round(d.y + s), 2, 2);
      }
      ctx!.fillStyle = "#cfe3f7";
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.life -= dt;
        if (s.life <= 0) {
          splashes.splice(i, 1);
          continue;
        }
        s.vy += 600 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        ctx!.globalAlpha = Math.min(0.8, s.life * 3);
        ctx!.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
      }
      ctx!.globalAlpha = 1;
    }

    /* ---------- 봄·가을·겨울: 떨어져서 쌓임 ---------- */
    function stepPile(p: PileProfile, now: number, t: number, dt: number, boxes: Box[], wind: number) {
      // 눈 덮개가 바람에 쓸려 날아감: 바람 부는 쪽 가장자리부터 깎고, 깎인 만큼 눈송이가 튀며 굴러 떨어짐
      if (p.cap && capSweeps.length) {
        capSweeps = capSweeps.filter((sw) => {
          if (now < sw.start) return true;
          const box = boxes[sw.b];
          if (!box) return false;
          const arr = capOf(sw.b, box);
          let budget = Math.min(sw.remaining, sw.rate * dt);
          sw.remaining -= budget;
          for (let k = 0; k < arr.length && budget > 0; k++) {
            const i = sw.side > 0 ? arr.length - 1 - k : k;
            if (arr[i] <= 0) continue;
            const take = Math.min(arr[i], budget);
            arr[i] -= take;
            budget -= take;
            sweepFlakeCarry += take;
            // 깎인 양만큼 눈송이 생성 (한 번 바람에 최대 개수 제한)
            while (sweepFlakeCarry >= SNOW_PER_FLAKE && sweepFlakes < SNOW_FLAKES_MAX) {
              sweepFlakeCarry -= SNOW_PER_FLAKE;
              sweepFlakes++;
              const kind = Math.floor(Math.random() * p.sprites.length);
              const size = p.sprites[kind].rows.length * p.px;
              const x = box.left + i * COL - size / 2;
              moving.push({
                kind,
                size,
                color: pick(p.sprites[kind].colors),
                x,
                y: box.top - arr[i] - size,
                vy: 0,
                baseX: x,
                amp: rand(3, 8),
                phase: rand(0, Math.PI * 2),
                rot: 0,
                rotAt: now,
                state: "roll",
                box: sw.b,
                dir: sw.side,
                speed: rand(170, 260),
                rollLeft: Infinity,
                lift: 0,
                vx: sw.side * rand(60, 120),
                hop: true,
                behind: -1,
              });
            }
          }
          return sw.remaining > 0.5;
        });
      }

      // 바람에 날아가는 쌓인 것: 윗면을 따라 통통 튀며 굴러가다 가장자리에서 떨어짐
      blowQueue = blowQueue.filter(([at, r]) => {
        if (now < at) return true;
        const idx = resting.indexOf(r);
        const box = boxes[r.box];
        if (idx < 0 || !box) return false;
        resting.splice(idx, 1);
        const x = box.left + r.relX;
        const dir = x + r.size / 2 < (box.left + box.right) / 2 ? -1 : 1;
        moving.push({
          kind: r.kind,
          size: r.size,
          color: r.color,
          x,
          y: box.top - r.size + sinkOf(r.size),
          vy: 0,
          baseX: x,
          amp: rand(3, 8),
          phase: rand(0, Math.PI * 2),
          rot: r.rot,
          rotAt: now,
          state: "roll",
          box: r.box,
          dir,
          speed: rand(170, 240),
          rollLeft: Infinity,
          lift: 0,
          vx: dir * rand(60, 110),
          hop: true,
          behind: -1,
        });
        return false;
      });

      // 생성
      if (now >= nextSpawn && moving.length < p.maxMoving) {
        const range = spawnRange();
        const kind = Math.floor(Math.random() * p.sprites.length);
        const size = p.sprites[kind].rows.length * p.px;
        if (range.right - range.left > size) {
          let x = rand(range.left, range.right - size);
          const small = boxes.filter((b) => b.right - b.left < SMALL_PERCH_W && b.top > 0 && b.left >= range.left - size && b.right <= range.right + size);
          let smallIdx = -1;
          if (small.length && Math.random() < SMALL_PERCH_RATE) {
            const b = pick(small);
            smallIdx = boxes.indexOf(b);
            x = rand(b.left, Math.max(b.left, b.right - size));
          }
          // 일부는 위 상자에 가려진 아래쪽 상자를 목표로 뒤로 지나감
          let behind = -1;
          if (Math.random() < BEHIND_RATE) {
            const cx = x + size / 2;
            const covered = boxes
              .map((_, i) => i)
              .filter((i) => {
                const b = boxes[i];
                if (!(cx > b.left + 4 && cx < b.right - 4)) return false;
                return boxes.some((o, j) => j !== i && o.bottom <= b.top && cx > o.left && cx < o.right);
              });
            if (covered.length) behind = pick(covered);
          }
          // 좁은 상자를 겨냥했는데 위가 가려져 있으면 뒤로 지나가 그 상자에 내려앉음
          if (smallIdx >= 0) {
            const b = boxes[smallIdx];
            const cx = x + size / 2;
            const hidden = boxes.some((o, j) => j !== smallIdx && o.bottom <= b.top && cx > o.left && cx < o.right);
            behind = hidden ? smallIdx : -1;
          }
          moving.push({
            kind,
            size,
            color: pick(p.sprites[kind].colors),
            x,
            y: -size,
            vy: rand(p.vy[0], p.vy[1]),
            baseX: x,
            amp: rand(p.amp[0], p.amp[1]),
            phase: rand(0, Math.PI * 2),
            rot: Math.random() < 0.5 ? 0 : 2,
            rotAt: now + rand(p.flutterMs[0], p.flutterMs[1]),
            state: "fall",
            box: -1,
            dir: 1,
            speed: 0,
            rollLeft: 0,
            lift: 0,
            vx: 0,
            hop: false,
            behind,
          });
        }
        nextSpawn = now + rand(p.spawnMs[0], p.spawnMs[1]);
      }

      const fullLift = p.maxLayers * p.layerPx;

      for (let i = moving.length - 1; i >= 0; i--) {
        const f = moving[i];
        const S = f.size;

        if (f.state === "fall") {
          const prevBottom = f.y + S;
          f.vy = Math.min(f.vy + 60 * dt, p.terminal);
          f.y += f.vy * dt;
          // 채팅 바람: 저마다 받는 세기를 다르게(0.5~1.5배) 해서 한 덩어리로 밀리지 않고 퍼짐
          const gustMul = 0.5 + f.phase / (Math.PI * 2);
          f.baseX += (wind * gustMul * outward(f.x) + f.vx) * dt; // 평소엔 좌우 흔들림만 (한쪽으로 쏠리지 않게)
          f.vx *= Math.max(0, 1 - 1.2 * dt);
          f.x = f.baseX + Math.sin(t * 1.1 + f.phase) * f.amp;
          if (p.flutterMs[1] > 0 && now >= f.rotAt) {
            f.rot = f.rot === 0 ? 2 : 0; // 살랑살랑 뒤집힘 (옆으로 누운 모양은 구를 때만)
            f.rotAt = now + rand(p.flutterMs[0], p.flutterMs[1]);
          }

          // 부딪힐 상자 찾기 (뒤로 지나가는 것은 목표 상자 윗면만)
          let landed = -1;
          // 눈 덮개가 있으면 그 윗면이 착지면
          const surfOf = (b: number, box: Box) => box.top - (p.cap ? capHeightAt(b, box, f.x + S / 2) : 0);
          if (f.behind >= 0) {
            const box = boxes[f.behind];
            if (!box) f.behind = -2;
            else {
              // 목표 상자 윗면에 걸쳐 있는 상자(메뉴판 이름표 등)가 먼저 막으면 그 위에 앉음
              for (let b = 0; b < boxes.length && landed < 0; b++) {
                const o = boxes[b];
                if (b === f.behind || !(o.top < box.top && o.bottom > box.top)) continue;
                if (!(f.x + S > o.left + 1 && f.x < o.right - 1)) continue;
                if (prevBottom <= surfOf(b, o) + 0.5 && f.y + S >= surfOf(b, o)) landed = b;
              }
              if (landed < 0 && prevBottom <= surfOf(f.behind, box) + 0.5 && f.y + S >= surfOf(f.behind, box)) {
                if (f.x + S > box.left + 1 && f.x < box.right - 1) landed = f.behind;
                else f.behind = -2;
              }
            }
          } else if (f.behind === -1 && !f.blown) {
            for (let b = 0; b < boxes.length; b++) {
              const box = boxes[b];
              if (!(f.x + S > box.left + 1 && f.x < box.right - 1)) continue;
              if (prevBottom <= surfOf(b, box) + 0.5 && f.y + S >= surfOf(b, box)) {
                landed = b;
                break;
              }
              if (f.y + S > box.top + sinkOf(S) && f.y < box.bottom) {
                // 옆면에 닿으면 밖으로 밀어내고 옆을 따라 떨어짐
                f.x = f.x + S / 2 < (box.left + box.right) / 2 ? box.left - S : box.right;
                f.amp *= 0.4;
                f.baseX = f.x - Math.sin(t * 1.1 + f.phase) * f.amp;
              }
            }
          }

          if (landed >= 0) {
            // 윗면 착지 → 쌓이거나 굴러감
            const box = boxes[landed];
            f.behind = -1;
            const relX = f.x - box.left;
            const lift = liftAt(p, landed, relX, S);
            const nearEdge = relX < EDGE || box.right - (f.x + S) < EDGE;
            if (lift >= fullLift || boxFull(p, landed) || nearEdge || Math.random() < p.rollRate) {
              f.state = "roll";
              f.box = landed;
              f.lift = lift;
              f.dir = nearEdge ? (relX < EDGE ? -1 : 1) : Math.random() < 0.5 ? -1 : 1;
              f.speed = rand(p.rollSpeed[0], p.rollSpeed[1]);
              f.rollLeft = nearEdge ? Infinity : rand(10, 50);
              f.y = box.top - S + sinkOf(S) - lift;
            } else {
              if (p.cap) deposit(p, landed, box, f.x + S / 2, S);
              else resting.push({ box: landed, relX, lift, kind: f.kind, size: S, color: f.color, rot: f.rot % 2 ? 0 : f.rot });
              moving.splice(i, 1);
              continue;
            }
          }
          if (f.y > ch + S) moving.splice(i, 1);
        } else {
          // 구르는 중: 윗면을 따라 이동
          const box = boxes[f.box];
          if (!box) {
            moving.splice(i, 1);
            continue;
          }
          const step = f.dir * f.speed * dt;
          f.x += step;
          f.rollLeft -= Math.abs(step);
          f.y = box.top - S + sinkOf(S) - (p.cap ? capHeightAt(f.box, box, f.x + S / 2) : f.lift) - (f.hop ? Math.abs(Math.sin(now / 110 + f.phase)) * 10 : 0);
          if (p.tumble && now >= f.rotAt) {
            f.rot = (f.rot + (f.dir > 0 ? 1 : 3)) % 4;
            f.rotAt = now + 90;
          }
          const cx = f.x + S / 2;
          if (cx < box.left || cx > box.right) {
            // 가장자리에서 굴러떨어짐
            f.state = "fall";
            f.x = f.dir > 0 ? box.right : box.left - S;
            if (f.hop) {
              // 바람에 날린 것: 살짝 튀어 오르며 제각각 멀리·가까이, 크게 흔들리며 흩어져 떨어짐
              f.vy = -rand(15, 70);
              f.vx = f.dir * rand(40, 220);
              f.amp = rand(8, 24);
              f.phase = rand(0, Math.PI * 2);
              f.hop = false;
              f.blown = true;
            } else {
              f.vy = 18;
              f.amp = rand(3, 8);
            }
            f.baseX = f.x - Math.sin(t * 1.1 + f.phase) * f.amp;
            f.box = -1;
            f.rot = f.rot % 2 ? 0 : f.rot;
          } else if (f.rollLeft <= 0) {
            // 조금 구르다 멈춰서 쌓임 (그 자리가 꽉 찼으면 더 굴러감)
            const relX = f.x - box.left;
            const lift = liftAt(p, f.box, relX, S);
            if (lift >= fullLift || boxFull(p, f.box)) f.rollLeft = rand(20, 60);
            else {
              if (p.cap) deposit(p, f.box, box, f.x + S / 2, S);
              else resting.push({ box: f.box, relX, lift, kind: f.kind, size: S, color: f.color, rot: f.rot % 2 ? 0 : f.rot });
              moving.splice(i, 1);
            }
          }
        }
      }

      // 눈 덮개: 2px 계단으로 흰 몸통 + 윗면 하이라이트 + 아래 그림자 + 옅은 외곽선
      if (p.cap) {
        for (const [b, arr] of caps) {
          const box = boxes[b];
          if (!box) continue;
          const cur = capOf(b, box);
          if (cur !== arr) continue;
          relax(arr);
          relax(arr);
          for (let i = 0; i < arr.length; i++) {
            const h = Math.round(arr[i] / 2) * 2;
            if (h < 2) continue;
            const x = Math.round(box.left + i * COL);
            const top = Math.round(box.top - h + 2);
            ctx!.fillStyle = "#9fb2c9";
            ctx!.fillRect(x, top - 2, COL, 2);
            ctx!.fillStyle = "#eef3fb";
            ctx!.fillRect(x, top, COL, h);
            ctx!.fillStyle = "#ffffff";
            ctx!.fillRect(x, top, COL, 2);
            if (h >= 6) {
              ctx!.fillStyle = "#d6e2f0";
              ctx!.fillRect(x, top + h - 3, COL, 3);
            }
          }
        }
      }

      // 쌓인 것 (상자를 따라 움직이고, 바람에 날려 가기 전까지 계속 남음)
      for (let i = resting.length - 1; i >= 0; i--) {
        const r = resting[i];
        const box = boxes[r.box];
        if (!box) {
          resting.splice(i, 1);
          continue;
        }
        ctx!.drawImage(sprite(p, r.kind, r.color, r.rot), Math.round(box.left + r.relX), Math.round(box.top - r.size + sinkOf(r.size) - r.lift));
      }
      // 뒤로 지나가는 것은 상자 영역을 잘라내고 그려 상자에 가려진 것처럼 보이게
      const draw = (f: Particle) => ctx!.drawImage(sprite(p, f.kind, f.color, f.rot), Math.round(f.x), Math.round(f.y));
      const back = moving.filter((f) => f.behind !== -1);
      if (back.length) {
        ctx!.save();
        ctx!.beginPath();
        ctx!.rect(0, 0, cw, ch);
        for (const b of boxes) ctx!.rect(b.left, b.top, b.right - b.left, b.bottom - b.top);
        ctx!.clip("evenodd");
        back.forEach(draw);
        ctx!.restore();
      }
      moving.filter((f) => f.behind === -1).forEach(draw);
    }

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(WIND_EVENT, onWind);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [stageId, season, on]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-20 h-full w-full" />;
}
