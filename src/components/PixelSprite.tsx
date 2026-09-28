import { spriteRects, type Palette } from "@/lib/pixel";

type Props = {
  rows: string[];
  palette: Palette;
  /** 픽셀 1칸 크기(px) */
  scale?: number;
  className?: string;
  title?: string;
};

export default function PixelSprite({ rows, palette, scale = 4, className, title }: Props) {
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * scale}
      height={h * scale}
      shapeRendering="crispEdges"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {spriteRects(rows, palette).map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  );
}
