import type { CSSProperties } from "react";
import { toolGroups } from "@/data/home";
import { pixelFrame } from "@/lib/pixel";
import { INK } from "@/lib/sprites";
import PixelSprite from "./PixelSprite";
import MenuIcon from "./MenuIcon";
import PlaqueXmas from "./PlaqueXmas";

/** 도구 하나하나의 신세대 트로피: 오른쪽 위를 비스듬히 깎은 흰 크리스털 블록 + 아래 금띠 (가운데에 아이콘) */
const CUP = [
  "oooooooooo......",
  "ohhhhhhhhhoo....",
  "ohwwwwwwwwwhoo..",
  "ohwwwwwwwwwwwhoo",
  "ohwwwwwwwwwwwwso",
  "ohwwwwwwwwwwwwso",
  "ohwwwwwwwwwwwwso",
  "ohwwwwwwwwwwwwso",
  "ohwwwwwwwwwwwwso",
  "ohwwwwwwwwwwwwso",
  "ohwwwwwwwwwwwwso",
  "ohwwwwwwwwwwwwso",
  "ohwwwwwwwwwwwwso",
  "ohwwwwwwwwwwwwso",
  "ohwwwwwwwwwwwwso",
  "ohwwwwwwwwwwwwso",
  "oggggggggggggggo",
  "oooooooooooooooo",
];
const CUP_PALETTE = { o: INK, w: "#f6f2ea", h: "#ffffff", s: "#c9bfae", g: "#e8b94a" };

/** 진열장 유리: 옅은 푸른 기 + 비스듬한 반사광 두 줄 */
const GLASS: CSSProperties = {
  background:
    "linear-gradient(115deg, transparent 18%, rgb(255 255 255 / 0.16) 20%, rgb(255 255 255 / 0.16) 25%, transparent 27%, transparent 62%, rgb(255 255 255 / 0.1) 64%, rgb(255 255 255 / 0.1) 66%, transparent 68%), rgb(190 225 255 / 0.08)",
  boxShadow: "0 0 0 2px rgb(30 18 10 / 0.55), inset 0 0 0 2px rgb(220 240 255 / 0.45), inset 0 4px 0 rgb(255 255 255 / 0.25)",
};

/** BEST AI 도구: 그룹마다 나무 탁상 하나, 그 위 유리 진열장 안에 도구별 트로피 3개 (흰 컵 + 나무 받침대) */
export default function BestTools() {
  return (
    <section className="mt-2 shrink-0 xl:mt-5 short:mt-1">
      <h2 data-leaf-perch className="relative mx-auto mb-6 w-fit px-5 py-1 text-base text-gold short:mb-4" style={pixelFrame("wood", 2)}>
        BEST AI 도구
        {/* 크리스마스 모드: 화환 */}
        <PlaqueXmas />
      </h2>

      <div className="grid gap-8 md:grid-cols-3 md:gap-6">
        {toolGroups.map((group) => (
          <article key={group.title} className="flex flex-col">
            {/* 유리 진열장: 눈·낙엽은 트로피가 아니라 진열장 윗면에 쌓임 */}
            <div data-leaf-perch className="relative mx-1.5 px-1 pt-2.5">
              <ul className="grid grid-cols-3 items-end gap-1.5 px-1">
                {group.items.map((item) => (
                  <li key={item.title}>
                    <a href="#" className="group flex flex-col items-center outline-none" style={{ "--tool": item.color } as CSSProperties}>
                      {/* 흰 컵: 평소엔 차분한 회갈색 아이콘, 올리면 도구 색으로 채워지고 빛남 */}
                      <span className="relative block transition group-hover:-translate-y-0.5 group-hover:drop-shadow-[0_0_6px_var(--tool)] group-focus-visible:-translate-y-0.5 group-focus-visible:drop-shadow-[0_0_6px_var(--tool)]">
                        <PixelSprite rows={CUP} palette={CUP_PALETTE} scale={3} />
                        <span className="absolute inset-0 flex items-center justify-center pb-1 pt-2 text-[#8a7a66] transition group-hover:text-[var(--tool)] group-focus-visible:text-[var(--tool)]">
                          <MenuIcon name={item.icon} size={26} />
                        </span>
                      </span>
                      {/* 나무 받침대 + 이름 */}
                      <span
                        className="-mt-0.5 block whitespace-nowrap px-2 text-center text-[11px] leading-5 text-cream"
                        style={pixelFrame("oak", 1)}
                      >
                        {item.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={GLASS} />
            </div>

            {/* 탁상: 상판(낙엽이 트로피 사이에도 쌓이도록 장애물) + 앞판 황동 명판 + 다리 */}
            <div data-leaf-perch className="h-3.5" style={pixelFrame("oak", 1)} />
            <div className="mx-2 flex justify-center border-x-4 border-b-4 border-ink bg-[#6e4124] py-1.5 shadow-[inset_0_2px_0_#4a2a16]">
              <h3
                className="whitespace-nowrap px-3 py-0.5 text-xs font-bold tracking-wide text-ink"
                style={{
                  background: "linear-gradient(#f4d98a, #c9a04a)",
                  boxShadow: "0 0 0 2px #1e120a, inset 0 -2px 0 #8a5f1c, inset 0 2px 0 #fff1c4",
                }}
              >
                {group.title}
              </h3>
            </div>
            <div aria-hidden="true" className="mx-4 flex justify-between">
              <span className="h-4 w-3 border-x-4 border-b-4 border-ink bg-[#8a5530] short:h-3" />
              <span className="h-4 w-3 border-x-4 border-b-4 border-ink bg-[#8a5530] short:h-3" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
