import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import WorksBoard from "@/components/WorksBoard";
import { pixelFrame } from "@/lib/pixel";

export const metadata: Metadata = {
  title: "aurora 내 작업",
  description: "AI 도구로 만든 작업을 도구별로 모아 보는 곳",
};

/** 내 작업: 도구로 만든 결과물을 도구마다 따로 분류해서 보여줌 */
export default function WorksPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Sidebar current="work" seasonControl={false} />

      {/* 모바일 전용 상단 로고 */}
      <header className="relative z-10 flex items-center border-b-4 border-ink bg-[#3a2416] px-4 py-2 md:hidden">
        <span className="text-lg text-gold">aurora</span>
      </header>

      <main className="relative z-10 mx-auto flex max-w-[1100px] flex-col gap-6 px-4 pb-28 pt-8 md:pb-10 md:pl-[136px] md:pr-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="w-fit px-5 py-1 text-lg text-gold" style={pixelFrame("wood", 2)}>
              내 작업
            </h1>
            <p className="mt-3 text-sm text-cream/75">AI 도구로 만든 작업을 도구별로 모아 뒀어요</p>
          </div>
          <p className="text-xs text-cream/50">※ 지금 보이는 작업은 화면 확인용 예시예요</p>
        </div>
        <WorksBoard />
      </main>
    </div>
  );
}
