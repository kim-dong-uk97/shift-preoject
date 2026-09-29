"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import WavyBorder from "./WavyBorder";
import PixelSprite from "./PixelSprite";
import PixelIcon from "./PixelIcon";
import CharacterPicker from "./CharacterPicker";
import TypeLine from "./TypeLine";
import ChristmasDecor from "./ChristmasDecor";
import { useSeason, WIND_EVENT } from "@/lib/season";
import { exclaimRows, INK, questionRows } from "@/lib/sprites";
import { defaultCharacter, subjectParticle, type Character } from "@/data/characters";
import { DEMO_DELAY_MS, DEMO_REPLY, GREETING, loadNpc, saveNpc, type ChatMessage as Message } from "@/lib/chat";
import { pixelFrame } from "@/lib/pixel";

// 대사 한 줄 높이(px). 로그 높이·스크롤 단위를 모두 이 값의 배수로 맞춰 줄이 잘려 보이지 않게 함
const LINE = 24;
const VISIBLE_LINES = 6;

/** RPG 하단 대화창: 왼쪽 NPC 초상화 + 오른쪽 대사 로그 + 하단 입력 */
export default function ChatHero({ className = "" }: { className?: string }) {
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const { xmas } = useSeason();
  const [npc, setNpc] = useState<Character>(defaultCharacter);
  const [pickerOpen, setPickerOpen] = useState(false);
  const nameplateRef = useRef<HTMLButtonElement>(null);

  // 저장해 둔 NPC 불러오기 (첫 렌더는 기본 캐릭터로 맞춰 하이드레이션 불일치 방지)
  useEffect(() => {
    const t = setTimeout(() => setNpc(loadNpc()), 0);
    return () => clearTimeout(t);
  }, []);

  const selectNpc = (c: Character) => {
    setNpc(c);
    saveNpc(c);
    setPickerOpen(false);
    nameplateRef.current?.focus();
  };

  const closePicker = useCallback(() => {
    setPickerOpen(false);
    nameplateRef.current?.focus();
  }, []);
  const [messages, setMessages] = useState<Message[]>([{ role: "npc", text: GREETING }]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const logRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // 사용자가 위로 스크롤해 읽는 중이면 자동으로 끌어내리지 않음
  const stickToBottom = useRef(true);

  const snapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(snapTimer.current);
    },
    [],
  );

  // 휠은 2줄씩 딱딱 이동 (끝에 닿으면 페이지 스크롤로 넘김)
  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    const onWheel = (e: WheelEvent) => {
      const dir = Math.sign(e.deltaY);
      const max = log.scrollHeight - log.clientHeight;
      if (!dir || max <= 0) return;
      if ((dir < 0 && log.scrollTop <= 0) || (dir > 0 && log.scrollTop >= max - 1)) return;
      e.preventDefault();
      const top = Math.round(log.scrollTop / LINE) * LINE + dir * LINE * 2;
      log.scrollTo({ top: Math.max(0, Math.min(max, top)), behavior: "smooth" });
    };
    log.addEventListener("wheel", onWheel, { passive: false });
    return () => log.removeEventListener("wheel", onWheel);
  }, []);

  // 대사가 추가되거나 한 글자씩 늘어날 때마다 맨 아래로 따라감
  useEffect(() => {
    const log = logRef.current;
    const content = contentRef.current;
    if (!log || !content) return;
    const ro = new ResizeObserver(() => {
      if (stickToBottom.current) log.scrollTop = log.scrollHeight;
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  const onScroll = () => {
    const log = logRef.current;
    if (!log) return;
    stickToBottom.current = log.scrollHeight - log.scrollTop - log.clientHeight < LINE;
    // 터치·드래그로 멈춘 경우에도 가장 가까운 줄 경계로 맞춤
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      const top = Math.round(log.scrollTop / LINE) * LINE;
      if (Math.abs(top - log.scrollTop) > 0.5) log.scrollTo({ top, behavior: "smooth" });
    }, 150);
  };


  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    stickToBottom.current = true;
    window.dispatchEvent(new Event(WIND_EVENT));
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setPending(true);
    timer.current = setTimeout(() => {
      setMessages((m) => [...m, { role: "npc", text: DEMO_REPLY }]);
      setPending(false);
    }, DEMO_DELAY_MS);
  };

  const lastIndex = messages.length - 1;

  return (
    <section
      data-leaf-perch
      className={`relative flex flex-col p-4 ${className}`}
    >
      <h1 className="sr-only">aurora 홈</h1>
      {/* 메인은 맛보기 — 제대로 된 대화는 AI Agent 화면에서 */}
      <Link
        href="/agent"
        className="px-btn absolute right-4 top-3 z-10 bg-parch px-2 py-0.5 text-[11px] hover:bg-gold"
      >
        크게 대화하기 ↗
      </Link>
      {/* 생각하는 동안에만 테두리를 따라 물결이 돌아감 (입력 중에는 움직임 없음) */}
      <WavyBorder amplitude={pending ? 4 : 0} grid={4} fill="var(--color-parch)" strokeWidth={4} />
      {/* 크리스마스 한정 장식 (사이드바 X-MAS 버튼) */}
      {xmas && <ChristmasDecor />}

      <div className="relative flex gap-4">
        {/* NPC 초상화 */}
        <div className="mt-7 flex shrink-0 flex-col items-center gap-2 self-start">
          <div className="relative p-1.5" style={pixelFrame("wood", 2)}>
            <PixelSprite rows={npc.rows} palette={npc.palette} scale={4} title={`${npc.role} ${npc.name}`} className="animate-npc h-[60px] w-auto sm:h-20 short:h-[60px]" />
            {/* 머리 위 기호: 평소 !, 생각하는 동안 ? */}
            <PixelSprite
              key={pending ? "q" : "e"}
              rows={pending ? questionRows : exclaimRows}
              palette={{ o: INK, y: pending ? "var(--color-cream)" : "var(--color-gold)" }}
              scale={3}
              className="animate-mark absolute -top-10 left-1/2 -translate-x-1/2"
            />
          </div>
          <button
            ref={nameplateRef}
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label={`대화 상대 바꾸기 (현재 ${npc.name})`}
            title="눌러서 대화 상대 바꾸기"
            className="px-btn flex items-center gap-1 bg-gold px-2 py-0.5 text-xs"
          >
            {/* 왼쪽 위 대각선 "click!" 안내 */}
            <span className="pointer-events-none absolute -left-3 -top-3.5 z-10 sm:-left-7 rotate-[14deg]" aria-hidden="true">
              <span className="animate-mark block whitespace-nowrap text-xs text-[#a8321f] [text-shadow:1px_0_0_var(--color-parch),-1px_0_0_var(--color-parch),0_1px_0_var(--color-parch),0_-1px_0_var(--color-parch)]">
                click!
              </span>
            </span>
            {npc.name}
            <span className="text-[9px]" aria-hidden="true">
              ▼
            </span>
          </button>
        </div>

        {/* 대사 로그: 6줄 높이 고정, 넘치면 줄 단위로 스크롤 (스크롤바는 숨김) */}
        <div
          ref={logRef}
          onScroll={onScroll}
          className="no-scrollbar min-w-0 flex-1 overflow-y-auto pr-28 text-[15px] text-ink"
          style={{ height: LINE * VISIBLE_LINES, lineHeight: `${LINE}px` }}
        >
          <div ref={contentRef} className="flex flex-col">
            {messages.map((m, i) =>
              m.role === "npc" ? (
                <p key={i}>{i === lastIndex ? <TypeLine text={m.text} showCaret={!pending} /> : m.text}</p>
              ) : (
                <p key={i} className="max-w-[85%] self-end text-right text-wood-dark">
                  {/* 인라인 배경이라 줄 높이(24px)는 그대로, 줄바꿈돼도 줄마다 바탕이 이어짐 */}
                  <span className="bg-[#dcc08e] px-2.5 py-[3px] shadow-[inset_0_-3px_0_0_#c4a36b] [box-decoration-break:clone]">
                    » {m.text}
                  </span>
                </p>
              ),
            )}
            {pending && (
              <p className="text-wood-dark" role="status">
                {npc.name}
                {subjectParticle(npc.name)} 생각하는 중
                {[0, 1, 2].map((i) => (
                  <span key={i} className="animate-caret" style={{ animationDelay: `${i * 0.2}s` }}>
                    .
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 입력창 */}
      <form onSubmit={onSubmit} className="relative mt-3 flex items-center gap-2 px-2 py-1" style={pixelFrame("wood", 2)}>
        <button type="button" aria-label="첨부" className="px-btn flex size-8 shrink-0 items-center justify-center bg-red">
          <PixelIcon name="plus" color="var(--color-cream)" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="당신에게 어떤 AI 도구가 필요하신가요?"
          className="min-w-0 flex-1 bg-transparent px-2 text-sm text-cream outline-none placeholder:text-cream/45 md:text-base"
        />
        <button type="button" aria-label="음성 입력" className="px-btn flex size-8 shrink-0 items-center justify-center bg-parch">
          <PixelIcon name="mic" color="var(--color-ink)" scale={2} />
        </button>
        <button type="submit" aria-label="전송" disabled={pending} className="px-btn flex size-8 shrink-0 items-center justify-center bg-gold">
          <PixelIcon name="send" color="var(--color-ink)" />
        </button>
      </form>
      <CharacterPicker open={pickerOpen} selectedId={npc.id} onSelect={selectNpc} onClose={closePicker} />
    </section>
  );
}
