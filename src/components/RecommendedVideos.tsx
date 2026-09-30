import Image from "next/image";
import { bestVideos } from "@/data/home";
import { pixelFrame } from "@/lib/pixel";
import PixelIcon from "./PixelIcon";
import SantaHang from "./SantaHang";
import SantaButton from "./SantaButton";

export default function RecommendedVideos() {
  return (
    <aside data-leaf-perch className="relative flex flex-col xl:min-h-0 xl:flex-1" style={pixelFrame("wood", 3)}>
      <header className="flex items-center gap-2 border-b-4 border-ink px-3 py-3 short:py-2">
        <span className="animate-candle text-gold" aria-hidden="true">
          ✦
        </span>
        <h2 className="min-w-0 flex-1 truncate text-sm text-gold">인기 BEST 추천영상</h2>
        {/* TODO(TBD): 이동할 영상 목록 페이지(또는 채널) 미정 */}
        <a href="#" className="px-btn shrink-0 whitespace-nowrap bg-gold px-2 py-0.5 text-[11px] text-ink">
          영상 더보기
        </a>
      </header>

      <ul className="grid gap-4 short:gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 no-scrollbar xl:flex xl:flex-1 xl:flex-col xl:justify-between xl:overflow-y-auto">
        {bestVideos.map((v) => (
          <li key={v.title}>
            <a href="#" className="group flex gap-3 xl:gap-2.5">
              <div className="relative aspect-[142/92] short:aspect-[142/78] w-32 shrink-0 self-start overflow-hidden border-4 border-ink bg-ink sm:w-28 xl:w-[116px]">
                <Image src={v.thumb} alt="" fill sizes="128px" className="object-cover transition-transform group-hover:scale-105" />
                {/* 재생 표시: 평소엔 숨기고 호버 시 노출 */}
                <span className="absolute inset-0 flex items-center justify-center bg-ink/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <PixelIcon name="play" color="var(--color-cream)" scale={3} />
                </span>
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 short:line-clamp-1 text-sm leading-snug text-cream group-hover:text-gold xl:text-[13px]">{v.title}</p>
                <p className="mt-0.5 text-xs text-cream/55">조회수 {v.views} 회</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {v.tags.map((t) => (
                    <span key={t} className="whitespace-nowrap bg-wood-dark px-1 text-[10px] leading-4 text-cream/80">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
      {/* 크리스마스 모드: 왼쪽 테두리 초인종 → 박스 뒤에서 빼꼼 나온 산타 */}
      <SantaButton />
      <SantaHang />
    </aside>
  );
}
