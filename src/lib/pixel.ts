import type { CSSProperties } from "react";

export type Palette = Record<string, string>;

/** 문자 그리드 → SVG rect 목록 (같은 색이 이어지면 한 rect로 합침) */
export function spriteRects(rows: string[], palette: Palette) {
  const rects: { x: number; y: number; w: number; fill: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let w = 1;
      while (row[x + w] === ch) w++;
      if (palette[ch]) rects.push({ x, y, w, fill: palette[ch] });
      x += w;
    }
  });
  return rects;
}

/*
 * 12x12 픽셀 프레임 (9-slice, slice=4)
 * k: 외곽선  h: 하이라이트  w: 면  s: 그림자  f: 안쪽 채움
 */
const FRAME = [
  ".kkkkkkkkkk.",
  "khhhhhhhhhsk",
  "khwwwwwwwwsk",
  "khwkkkkkkwsk",
  "khwkffffkwsk",
  "khwkffffkwsk",
  "khwkffffkwsk",
  "khwkffffkwsk",
  "khwkkkkkkwsk",
  "khwwwwwwwwsk",
  "kssssssssssk",
  ".kkkkkkkkkk.",
];

function frameSvg(palette: Palette) {
  const rects = spriteRects(FRAME, palette)
    .map((r) => `<rect x='${r.x}' y='${r.y}' width='${r.w}' height='1' fill='${r.fill}'/>`)
    .join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' shape-rendering='crispEdges'>${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const INK = "#1e120a";

export const framePalettes = {
  wood: { k: INK, h: "#c08850", w: "#8a5530", s: "#5c3620", f: "#3a2416" },
  parchment: { k: INK, h: "#fff5dc", w: "#e8d3a4", s: "#b9965e", f: "#efdfb8" },
  chalkboard: { k: INK, h: "#c08850", w: "#8a5530", s: "#5c3620", f: "#243328" },
  gilded: { k: INK, h: "#ffe39a", w: "#d4a23c", s: "#8a5f1c", f: "#1f3527" },
  oak: { k: INK, h: "#e0a868", w: "#b9783f", s: "#7a4724", f: "#a4642f" },
  porcelain: { k: INK, h: "#ffffff", w: "#e4ddd0", s: "#a39885", f: "#f6f2ea" },
} satisfies Record<string, Palette>;

/** 픽셀 프레임 스타일. scale은 픽셀 1칸의 크기(px) */
export function pixelFrame(kind: keyof typeof framePalettes, scale = 3): CSSProperties {
  const width = 4 * scale;
  return {
    borderStyle: "solid",
    borderWidth: width,
    borderImage: `${frameSvg(framePalettes[kind])} 4 fill / ${width}px stretch`,
  };
}
