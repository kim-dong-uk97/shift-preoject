import Sidebar from "@/components/Sidebar";
import ChatHero from "@/components/ChatHero";
import PromoBanner from "@/components/PromoBanner";
import BestTools from "@/components/BestTools";
import RecommendedVideos from "@/components/RecommendedVideos";
import GoldMine from "@/components/GoldMine";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Sidebar />

      {/* 모바일 전용 상단 로고 */}
      <header className="relative z-10 flex items-center border-b-4 border-ink bg-[#3a2416] px-4 py-3 md:hidden">
        <span className="text-lg text-gold">aurora</span>
      </header>

      <div className="relative z-10 flex flex-col gap-10 px-4 pb-28 pt-8 md:pb-8 md:pl-[136px] md:pr-6 xl:h-screen xl:flex-row xl:gap-14 xl:py-4">
        {/* xl 이상: 한 화면 높이에 고정, 세로 가운데 정렬 (넘치는 경우에만 스크롤) */}
        <main className="mx-auto flex w-full max-w-[900px] flex-col gap-8 xl:min-h-0 xl:justify-center-safe xl:gap-5 xl:overflow-x-hidden xl:overflow-y-auto xl:px-3 xl:pb-3 xl:pt-10 short:pt-4">
          <ChatHero className="shrink-0" />
          <PromoBanner />
          <BestTools />
        </main>

        {/* 오른쪽 열: 추천영상(남는 높이) + 금광 위젯 */}
        <div className="flex flex-col gap-14 xl:h-full xl:w-[300px] xl:shrink-0 xl:gap-5">
          <RecommendedVideos />
          <GoldMine />
        </div>
      </div>
    </div>
  );
}
