"use client";

import { useState } from "react";
import { setSeasonState, useSeason } from "@/lib/season";

/** 크리스마스 모드: 추천영상 박스 왼쪽 테두리 가운데 초인종 — 누르면 "띵동" 하고 산타가 나오고, 다시 누르면 들어감 */
export default function SantaButton() {
  const { xmas, santa } = useSeason();
  const [ding, setDing] = useState(0);
  if (!xmas) return null;
  return (
    <div className="absolute -left-[26px] top-[64%] z-10 hidden -translate-y-1/2 xl:block short:top-[76%]">
      <button
        type="button"
        aria-pressed={santa}
        aria-label={santa ? "산타 들여보내기" : "초인종 누르고 산타 부르기"}
        title={santa ? "산타 들여보내기" : "띵동! 산타 부르기"}
        onClick={() => {
          if (!santa) setDing((d) => d + 1);
          setSeasonState({ santa: !santa });
        }}
        className="px-btn flex h-9 w-7 flex-col items-center justify-center gap-0.5 bg-parch"
      >
        {/* 초인종 버튼 */}
        <span className={`block size-3.5 rounded-full border-2 border-ink ${santa ? "bg-gold" : "bg-red"}`} />
        <span className="block h-0.5 w-3 bg-ink/40" />
      </button>
      {ding > 0 && (
        <span key={ding} className="animate-ding pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-parch px-1.5 text-[11px] text-ink shadow-[0_0_0_2px_#1e120a]">
          띵동!
        </span>
      )}
    </div>
  );
}
