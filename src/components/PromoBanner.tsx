import { pixelFrame } from "@/lib/pixel";
import { gemRows, INK } from "@/lib/sprites";
import { CAT, CAT_PALETTE } from "@/lib/cat";
import PixelSprite from "./PixelSprite";
import Link from "next/link";

/** 게시판에 붙은 의뢰서 느낌의 배너 */
export default function PromoBanner() {
  return (
    <section data-leaf-perch className="relative flex shrink-0 flex-col gap-3 px-5 py-4 text-ink short:py-3 md:flex-row md:items-center md:gap-6 md:px-6" style={pixelFrame("parchment", 3)}>
      {/* 압정 */}
      <PixelSprite rows={gemRows} palette={{ o: INK, x: "var(--color-red)", h: "#ffb0a0" }} scale={3} className="absolute -top-4 left-1/2 -translate-x-1/2" />

      <div className="relative min-w-0 flex-1">
        <span className="px-btn inline-block bg-red px-2 py-0.5 text-xs text-cream short:hidden">NEW 의뢰</span>
        <p className="mt-2 short:mt-0 text-base font-bold leading-snug md:text-lg">업무 자동화부터 나만의 맞춤 에이전트 구축까지</p>
        <p className="mt-0.5 text-sm text-wood-dark">AI를 배우는 것을 넘어, 내 일을 대신할 맞춤 AI Agent를 직접 완성해 보세요</p>
      </div>
      <div className="relative flex shrink-0 flex-wrap items-center gap-3">
        {/* 안내 캐릭터 + 말풍선 + 버튼을 가리키는 화살표 (넓은 화면에서만) */}
        <div aria-hidden="true" className="pointer-events-none hidden items-end gap-1 self-end md:flex">
          <div className="relative">
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-cream px-1.5 py-0.5 text-[11px] leading-4 text-ink shadow-[0_0_0_2px_#1e120a] short:-top-6">
              같이 만들자냥!
              <span className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-[#1e120a]" />
            </span>
            <PixelSprite rows={CAT} palette={CAT_PALETTE} scale={3} className="animate-npc -mb-3 h-12 w-auto short:-mb-4 short:h-[40px]" />
          </div>
          <span className="animate-nudge mb-3 text-sm text-red">▶</span>
        </div>
        <button type="button" className="px-btn relative bg-gold px-4 py-1.5 text-sm">
          AI 만들기
        </button>
        <Link href="/guide" className="px-btn relative bg-cream px-4 py-1.5 text-sm">
          알아보기
        </Link>
      </div>
    </section>
  );
}
