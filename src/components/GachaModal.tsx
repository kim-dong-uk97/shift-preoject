"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { drawPrize, prizes, rarityInfo, type Prize } from "@/data/prizes";
import { pixelFrame } from "@/lib/pixel";
import { capsuleRows, INK, prizeSprites, ticketPalette, ticketRows } from "@/lib/sprites";
import PixelSprite from "./PixelSprite";
import { unlockRandomCharacter, type Character } from "@/data/characters";

const HISTORY_KEY = "aurora.gacha.history";
const ROLL_MS = 1200;

type Props = {
  open: boolean;
  onClose: () => void;
  /** 사용 가능한 뽑기권 수 */
  tickets: number;
  /** 뽑기권 1장 차감. 차감에 실패하면 false */
  onUseTicket: () => boolean;
};

function PrizeIcon({ prize, scale }: { prize: Prize; scale: number }) {
  return <PixelSprite rows={prizeSprites[prize.sprite].rows} palette={{ o: INK, ...prize.colors }} scale={scale} />;
}

function readHistory(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function GachaModal({ open, onClose, tickets, onUseTicket }: Props) {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  /** 캐릭터 뽑기 결과: 얻은 캐릭터 / 이미 모두 모음(null) / 해당 없음(undefined) */
  const [wonChar, setWonChar] = useState<Character | null | undefined>(undefined);
  const [history, setHistory] = useState<string[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const rollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(rollTimer.current), []);

  // 열릴 때: 기록 불러오기, 닫기 버튼에 포커스, Esc로 닫기
  useEffect(() => {
    if (!open) return;
    const init = setTimeout(() => setHistory(readHistory()), 0);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(init);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const saveHistory = (next: string[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // 저장 불가 환경에서는 화면에만 표시
    }
    return next;
  };

  const onDraw = () => {
    if (rolling || !onUseTicket()) return;
    setResult(null);
    setWonChar(undefined);
    setRolling(true);
    rollTimer.current = setTimeout(() => {
      const prize = drawPrize();
      setWonChar(prize.id === "character" ? unlockRandomCharacter() : undefined);
      setResult(prize);
      setRolling(false);
      setHistory((h) => saveHistory([prize.id, ...h].slice(0, 8)));
    }, ROLL_MS);
  };

  const byId = (id: string) => prizes.find((p) => p.id === id);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gacha-title"
        className="no-scrollbar max-h-[92vh] w-full max-w-[520px] overflow-y-auto text-cream"
        style={pixelFrame("wood", 3)}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b-4 border-ink px-4 py-3">
          <h2 id="gacha-title" className="text-base text-gold">
            ✦ 뽑기 상점
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="닫기" className="px-btn flex size-8 items-center justify-center bg-cream text-sm">
            ✕
          </button>
        </header>

        {/* 뽑기 기계 */}
        <div className="flex flex-col items-center gap-3 border-b-4 border-ink bg-[#1a110b] px-4 py-5">
          <div className="flex h-24 items-center justify-center">
            {result ? (
              <div key={result.id + history.length} className="animate-reveal flex flex-col items-center gap-2">
                {wonChar ? (
                  // 캐릭터 뽑기 당첨: 얻은 캐릭터를 그대로 보여 줌
                  <PixelSprite rows={wonChar.rows} palette={wonChar.palette} scale={4} className="h-24 w-auto" />
                ) : (
                  <PrizeIcon prize={result} scale={6} />
                )}
              </div>
            ) : (
              <PixelSprite
                rows={capsuleRows}
                palette={{ o: INK, c: "var(--color-red)", h: "#ffb0a0", w: "#efe6d2" }}
                scale={7}
                className={rolling ? "animate-shake" : ""}
              />
            )}
          </div>

          <p className="min-h-6 text-center text-sm" role="status">
            {rolling ? (
              "두근두근..."
            ) : result ? (
              result.rarity === "miss" ? (
                "아쉽지만 꽝! 다음 기회에"
              ) : result.id === "character" ? (
                wonChar ? (
                  <>
                    <span className={`mr-2 px-1.5 text-xs ${rarityInfo[result.rarity].className}`}>{rarityInfo[result.rarity].label}</span>
                    동료 <span className="text-gold">{wonChar.name}</span>({wonChar.role}) 획득! 동료 선택에서 만날 수 있어요
                  </>
                ) : (
                  // TODO(TBD): 모두 모은 뒤 캐릭터 뽑기 당첨 시 보상 방식 미정
                  "캐릭터를 이미 모두 모았어요!"
                )
              ) : (
                <>
                  <span className={`mr-2 px-1.5 text-xs ${rarityInfo[result.rarity].className}`}>{rarityInfo[result.rarity].label}</span>
                  <span className="text-gold">{result.name}</span> 획득!
                </>
              )
            ) : (
              "뽑기권 1장으로 캡슐 하나를 뽑을 수 있어요"
            )}
          </p>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm">
              <PixelSprite rows={ticketRows} palette={ticketPalette} scale={2} />
              보유 <span className="text-gold">× {tickets}</span>
            </span>
            <button type="button" onClick={onDraw} disabled={rolling || tickets <= 0} className="px-btn bg-gold px-4 py-1.5 text-sm">
              {tickets > 0 ? "뽑기 (1장)" : "뽑기권 부족"}
            </button>
          </div>
        </div>

        {/* 상품 목록 */}
        <section className="px-4 py-4" aria-labelledby="prize-list-title">
          <h3 id="prize-list-title" className="mb-3 text-sm text-gold">
            상품 목록
          </h3>
          <ul className="flex flex-col gap-2">
            {prizes.map((p) => (
              <li key={p.id} className="flex items-center gap-3 bg-[#2a1a10] px-2 py-1.5">
                <span className="flex size-10 shrink-0 items-center justify-center bg-[#1a110b]">
                  <PrizeIcon prize={p} scale={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">{p.name}</span>
                  <span className="block truncate text-[11px] text-cream/55">{p.desc}</span>
                </span>
                <span className={`shrink-0 px-1.5 text-[11px] ${rarityInfo[p.rarity].className}`}>{rarityInfo[p.rarity].label}</span>
                <span className="w-10 shrink-0 text-right text-xs text-cream/70">{p.weight}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-cream/45">※ 상품 구성과 확률은 예시이며 확정 전입니다. 지급 방식은 추후 안내 예정.</p>

          {history.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs text-cream/70">최근 획득</h3>
              <div className="flex flex-wrap gap-1.5">
                {history.map((id, i) => {
                  const p = byId(id);
                  return p ? (
                    <span key={i} className="flex items-center gap-1 bg-[#2a1a10] px-1.5 py-0.5 text-[11px]">
                      <PrizeIcon prize={p} scale={1} />
                      {p.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>,
    document.body,
  );
}
