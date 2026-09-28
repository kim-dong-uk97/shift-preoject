"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pixelFrame } from "@/lib/pixel";
import {
  minerDownRows,
  minerPalette,
  minerUpRows,
  orePalette,
  oreRows,
  ticketPalette,
  ticketRows,
} from "@/lib/sprites";
import PixelSprite from "./PixelSprite";
import GachaModal from "./GachaModal";

/** 뽑기권 지급 간격(초) */
const TICKET_INTERVAL = 30 * 60;
/** 처음부터 주는 기본 뽑기권 */
const STARTER_TICKETS = 2;
const STORAGE_KEY = "aurora.mining.seconds";
const USED_KEY = "aurora.gacha.used";
const SEGMENTS = 10;

function readNumber(key: string) {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

function saveNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // 저장이 막힌 환경(시크릿 창 등)에서는 이번 방문 동안만 유지
  }
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * 사용시간 금광: 탭이 보이는 동안 1초씩 쌓이고 30분마다 뽑기권 1장.
 * TODO(TBD): 실제 지급·사용은 서버 기록 기준으로 바꿔야 함 (현재는 브라우저 저장소)
 */
export default function GoldMine() {
  const [seconds, setSeconds] = useState<number | null>(null);
  const [popKey, setPopKey] = useState(0);
  const [used, setUsed] = useState(0);
  const [open, setOpen] = useState(false);
  const secRef = useRef(0);
  const usedRef = useRef(0);
  const signRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    secRef.current = readNumber(STORAGE_KEY);
    usedRef.current = readNumber(USED_KEY);
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      secRef.current += 1;
      saveNumber(STORAGE_KEY, secRef.current);
      setSeconds(secRef.current);
      if (secRef.current % TICKET_INTERVAL === 0) setPopKey((k) => k + 1);
    }, 1000);
    // 첫 화면은 저장된 값으로 바로 표시
    const init = setTimeout(() => {
      setSeconds(secRef.current);
      setUsed(usedRef.current);
    }, 0);
    return () => {
      clearInterval(id);
      clearTimeout(init);
    };
  }, []);

  const ready = seconds !== null;
  const sec = seconds ?? 0;
  // 보유 뽑기권 = 기본 지급 + 사용시간 지급 - 사용
  const tickets = Math.max(0, STARTER_TICKETS + Math.floor(sec / TICKET_INTERVAL) - used);
  const progress = (sec % TICKET_INTERVAL) / TICKET_INTERVAL;
  const remain = TICKET_INTERVAL - (sec % TICKET_INTERVAL);
  const filled = Math.floor(progress * SEGMENTS);

  const spendTicket = () => {
    if (STARTER_TICKETS + Math.floor(secRef.current / TICKET_INTERVAL) - usedRef.current <= 0) return false;
    usedRef.current += 1;
    saveNumber(USED_KEY, usedRef.current);
    setUsed(usedRef.current);
    return true;
  };

  const closeGacha = useCallback(() => {
    setOpen(false);
    signRef.current?.focus();
  }, []);

  return (
    <section data-leaf-perch className="relative shrink-0" style={pixelFrame("wood", 3)} aria-label="사용시간 금광">
      {/*
        뽑기 간판 (틀 바깥)
        xl: 왼쪽 벽에서 쇠 막대가 튀어나오고 사슬에 간판이 매달림
        그 외: 틀 위에 기둥 두 개로 세운 간판
      */}
      <div className="absolute bottom-[calc(100%+12px)] right-6 z-10 flex flex-col items-center xl:bottom-auto xl:right-[calc(100%+12px)] xl:top-3 xl:w-14 xl:items-stretch">
        <span className="hidden h-1.5 border-y-2 border-ink bg-[#a8a29a] xl:block" aria-hidden="true" />
        <div className="flex origin-top flex-col-reverse items-center transition-transform xl:flex-col xl:hover:-rotate-6">
          <div className="flex w-10 justify-between px-1.5" aria-hidden="true">
            <span className="h-4 w-[3px] bg-[#a8a29a]" />
            <span className="h-4 w-[3px] bg-[#a8a29a]" />
          </div>
          <button ref={signRef} type="button" onClick={() => setOpen(true)} aria-label={`뽑기 열기 (보유 뽑기권 ${tickets}장)`} className="relative">
            <span data-leaf-perch className="px-btn block bg-red px-2 py-1 text-xs text-cream">
              뽑기
            </span>
            {tickets > 0 && (
              <span className="absolute -right-2.5 -top-2.5 border-2 border-ink bg-gold px-1 text-[9px] leading-3 text-ink" aria-hidden="true">
                {tickets}
              </span>
            )}
          </button>
        </div>
      </div>

      <header className="flex items-center justify-between border-b-4 border-ink px-3 py-2">
        <h2 className="text-sm text-gold">금광 캐기</h2>
        <p className="text-xs text-cream/70">
          사용시간 <span className="text-sm text-gold">{ready ? Math.floor(sec / 60) : "--"}분</span>
        </p>
      </header>

      {/* 광산 장면 */}
      <div className="relative flex h-[88px] short:h-[72px] items-end justify-center overflow-hidden bg-[#1a110b] bg-[repeating-linear-gradient(90deg,transparent_0_22px,rgb(255_255_255/0.03)_22px_24px)]">
        <div className="absolute inset-x-0 bottom-0 h-3 bg-[#3b2a1c]" />
        <div className="relative mb-3 flex items-end">
          <div className="relative h-16 w-20">
            <PixelSprite rows={minerUpRows} palette={minerPalette} scale={4} className="animate-swing-up absolute inset-0" />
            <PixelSprite rows={minerDownRows} palette={minerPalette} scale={4} className="animate-swing-down absolute inset-0" />
          </div>
          <div className="relative -ml-4">
            <PixelSprite rows={oreRows} palette={orePalette} scale={4} />
            {/* 금 부스러기 */}
            {[-10, 4, 14].map((dx, i) => (
              <span
                key={dx}
                className="animate-spark absolute left-1 top-3 size-1.5 bg-gold"
                style={{ ["--dx" as string]: `${dx}px`, animationDelay: `${i * 0.03}s` }}
              />
            ))}
          </div>
        </div>

        {popKey > 0 && (
          <div
            key={popKey}
            role="status"
            className="animate-ticket-pop absolute left-1/2 top-2 flex items-center gap-2 bg-parch px-2 py-1 text-xs text-ink"
            style={pixelFrame("parchment", 1)}
          >
            <PixelSprite rows={ticketRows} palette={ticketPalette} scale={2} />
            뽑기권 획득!
          </div>
        )}
      </div>

      {/* 진행도 + 보유 뽑기권 */}
      <div className="flex flex-col gap-2 px-3 py-2.5">
        <div className="flex items-center justify-between text-[11px] text-cream/70">
          <span>다음 뽑기권까지</span>
          <span className="text-cream">{ready ? `${pad(Math.floor(remain / 60))}:${pad(remain % 60)}` : "--:--"}</span>
        </div>
        <div
          className="flex gap-0.5 border-4 border-ink bg-[#1a110b] p-0.5"
          role="progressbar"
          aria-label="다음 뽑기권까지 진행도"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span key={i} className={`h-2.5 flex-1 ${i < filled ? "bg-gold" : "bg-wood-dark"}`} />
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <PixelSprite rows={ticketRows} palette={ticketPalette} scale={3} />
          <span className="text-cream">
            뽑기권 <span className="text-gold">× {tickets}</span>
          </span>
          <span className="ml-auto text-[10px] text-cream/45">30분마다 1장</span>
        </div>
      </div>
      <GachaModal open={open} onClose={closeGacha} tickets={tickets} onUseTicket={spendTicket} />
    </section>
  );
}
