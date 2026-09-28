"use client";

import { useEffect, useRef } from "react";

const PAD = 14; // 물결이 박스 밖으로 튀어나갈 여유 공간

type Props = {
  /** 물결 진폭(px). 0이면 반듯한 사각형 테두리 */
  amplitude: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  /** 픽셀 격자 크기(px). 지정하면 좌표를 격자에 맞춰 계단형으로 그림 */
  grid?: number;
};

// 사각형 둘레 위의 좌표와 바깥 방향 법선
function pointAt(s: number, w: number, h: number): [number, number, number, number] {
  if (s < w) return [s, 0, 0, -1];
  if (s < w + h) return [w, s - w, 1, 0];
  if (s < 2 * w + h) return [w - (s - w - h), h, 0, 1];
  return [0, h - (s - 2 * w - h), -1, 0];
}

function buildPath(w: number, h: number, amp: number, phase: number, grid: number) {
  const snap = (v: number) => (grid ? Math.round(v / grid) * grid : Number(v.toFixed(1)));
  const perimeter = 2 * (w + h);
  // 이음새가 생기지 않도록 둘레에 물결 개수를 정수로 맞춤
  const waves = Math.max(6, Math.round(perimeter / 38));
  const n = Math.ceil(perimeter / 4);
  let d = "";
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * perimeter;
    const [x, y, nx, ny] = pointAt(Math.min(s, perimeter - 0.001), w, h);
    const off = amp * Math.sin((2 * Math.PI * waves * s) / perimeter - phase);
    const px = snap(PAD + x + nx * off);
    const py = snap(PAD + y + ny * off);
    // 격자 모드는 가로→세로로 꺾어 도트 계단을 만든다
    d += !i ? `M${px} ${py}` : grid ? `H${px}V${py}` : `L${px} ${py}`;
  }
  return d + "Z";
}

/**
 * 부모(relative) 박스 크기에 맞춰 테두리를 그리고,
 * amplitude가 커지면 테두리를 따라 흐르는 물결로 부드럽게 전환한다.
 */
export default function WavyBorder({ amplitude, fill = "#fff", stroke = "var(--color-ink)", strokeWidth = 2, grid = 0 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mainRef = useRef<SVGPathElement>(null);
  const state = useRef({ w: 0, h: 0, amp: 0, target: 0, raf: 0, reduced: false, grid });

  const draw = (phase: number) => {
    const s = state.current;
    if (!s.w || !s.h) return;
    mainRef.current?.setAttribute("d", buildPath(s.w, s.h, s.amp, phase, s.grid));
  };

  const tick = (now: number) => {
    const s = state.current;
    s.amp += (s.target - s.amp) * 0.08;
    const settled = s.target === 0 && s.amp < 0.05;
    if (settled) s.amp = 0;
    draw(s.reduced ? 0 : now / 160);
    s.raf = settled ? 0 : requestAnimationFrame(tick);
  };

  const start = () => {
    if (!state.current.raf) state.current.raf = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const s = state.current;
    s.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const parent = svgRef.current?.parentElement;
    if (!parent) return;

    const ro = new ResizeObserver(([entry]) => {
      s.w = entry.contentRect.width + parsePx(parent, "padding-left") + parsePx(parent, "padding-right");
      s.h = entry.contentRect.height + parsePx(parent, "padding-top") + parsePx(parent, "padding-bottom");
      svgRef.current?.setAttribute("width", String(s.w + PAD * 2));
      svgRef.current?.setAttribute("height", String(s.h + PAD * 2));
      draw(0);
    });
    ro.observe(parent);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, []);

  useEffect(() => {
    state.current.target = amplitude;
    start();
    // start는 ref만 참조하므로 amplitude 변경 시에만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amplitude]);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className="pointer-events-none absolute overflow-visible"
      style={{ left: -PAD, top: -PAD }}
    >
      <path
        ref={mainRef}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin={grid ? "miter" : "round"}
        shapeRendering={grid ? "crispEdges" : undefined}
      />
    </svg>
  );
}

function parsePx(el: Element, prop: string) {
  return parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0;
}
