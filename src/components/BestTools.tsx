import type { CSSProperties } from "react";
import { toolGroups } from "@/data/home";
import { pixelFrame } from "@/lib/pixel";
import { INK } from "@/lib/sprites";
import PixelSprite from "./PixelSprite";
import MenuIcon from "./MenuIcon";
import PlaqueXmas from "./PlaqueXmas";

/** 액자 모서리 금 장식 (왼쪽 위 기준, 나머지 모서리는 뒤집어 씀) */
const CORNER = ["oyyyo", "yhyo.", "yyo..", "yo...", "o...."];
const CORNER_PALETTE = { o: INK, y: "#e8b94a", h: "#fff1c4" };
const CORNERS = [
  "left-0 top-0",
  "right-0 top-0 -scale-x-100",
  "bottom-0 left-0 -scale-y-100",
  "bottom-0 right-0 -scale-100",
];

/** BEST AI 도구: 벽에 걸린 금박 액자 3개 (오피스 스위트 · 빌드 스위트 · 콘텐츠 제작) */
export default function BestTools() {
  return (
    <section className="mt-2 shrink-0 xl:mt-5 short:mt-1">
      <h2 data-leaf-perch className="relative mx-auto mb-10 w-fit px-5 py-1 text-base text-gold short:mb-8" style={pixelFrame("wood", 2)}>
        BEST AI 도구
        {/* 크리스마스 모드: 화환 */}
        <PlaqueXmas />
      </h2>

      <div className="grid gap-12 md:grid-cols-3 md:gap-6">
        {toolGroups.map((group) => (
          <article key={group.title} data-leaf-perch className="relative px-3 pb-3 pt-7" style={pixelFrame("gilded", 3)}>
            {/* 걸이: 못 + 명판까지 이어진 줄 */}
            <svg aria-hidden="true" width="96" height="14" className="pointer-events-none absolute -top-[30px] left-1/2 -translate-x-1/2 overflow-visible">
              <path d="M18 14 L48 3 L78 14" fill="none" stroke="#b9965e" strokeWidth="2" />
              <rect x="44" y="-1" width="8" height="8" fill={INK} />
              <rect x="46" y="1" width="4" height="4" fill="#c9a25a" />
            </svg>

            {/* 황동 명판 (낙엽이 명판 위에도 쌓이도록 장애물로 등록) */}
            <header
              data-leaf-perch
              className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-0.5 text-ink"
              style={{
                background: "linear-gradient(#f4d98a, #c9a04a)",
                boxShadow: "0 0 0 2px #1e120a, inset 0 -2px 0 #8a5f1c, inset 0 2px 0 #fff1c4",
              }}
            >
              <h3 className="text-xs font-bold tracking-wide">{group.title}</h3>
            </header>

            {/* 모서리 금 장식 */}
            {CORNERS.map((pos) => (
              <PixelSprite key={pos} rows={CORNER} palette={CORNER_PALETTE} scale={2} className={`pointer-events-none absolute ${pos}`} />
            ))}

            <ul className="grid grid-cols-3 gap-1">
              {group.items.map((item) => (
                <li key={item.title}>
                  <a
                    href="#"
                    className="group flex flex-col items-center gap-1.5 py-1 outline-none"
                    style={{ "--tool": item.color } as CSSProperties}
                  >
                    {/* 면 아이콘: 평소엔 차분한 금빛, 올리면 도구 색으로 채워짐 */}
                    <span className="flex size-11 items-center justify-center bg-[#132519] text-[#b9965e] shadow-[inset_0_0_0_2px_#8a5f1c] transition group-hover:-translate-y-0.5 group-hover:text-[var(--tool)] group-hover:shadow-[inset_0_0_0_2px_var(--tool),0_0_12px_var(--tool)] group-focus-visible:-translate-y-0.5 group-focus-visible:text-[var(--tool)] group-focus-visible:shadow-[inset_0_0_0_2px_var(--tool),0_0_12px_var(--tool)]">
                      <MenuIcon name={item.icon} size={24} />
                    </span>
                    <span className="whitespace-nowrap text-xs text-parch/80 group-hover:text-parch group-focus-visible:text-parch">{item.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
