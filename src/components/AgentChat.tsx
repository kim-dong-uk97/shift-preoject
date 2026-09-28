"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import PixelSprite from "./PixelSprite";
import PixelIcon from "./PixelIcon";
import TypeLine from "./TypeLine";
import { defaultCharacter, subjectParticle, type Character } from "@/data/characters";
import {
  DEMO_DELAY_MS,
  DEMO_REPLY,
  GREETING,
  loadConversations,
  loadNpc,
  relativeTime,
  saveConversations,
  titleFrom,
  type ChatMessage,
  type Conversation,
} from "@/lib/chat";
import { pixelFrame } from "@/lib/pixel";

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `c${Date.now()}${Math.random()}`);

/** AI Agent 전체 화면 대화: 왼쪽 최근 대화 목록 + 가운데 넓은 대화창 + 하단 입력 */
export default function AgentChat() {
  const [npc, setNpc] = useState<Character>(defaultCharacter);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ChatMessage[]>([{ role: "npc", text: GREETING }]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [now, setNow] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 저장된 NPC·대화 불러오기 (첫 렌더는 기본값으로 맞춰 하이드레이션 불일치 방지)
  useEffect(() => {
    const t = setTimeout(() => {
      setNpc(loadNpc());
      setConversations(loadConversations());
      setNow(Date.now());
    }, 0);
    const tick = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      clearTimeout(t);
      clearInterval(tick);
      clearTimeout(timer.current);
    };
  }, []);

  // 새 대사가 늘어날 때마다 맨 아래로
  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const ro = new ResizeObserver(() => (el.scrollTop = el.scrollHeight));
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  const active = conversations.find((c) => c.id === activeId);
  const messages = active ? active.messages : draft;
  const lastIndex = messages.length - 1;

  const updateConversations = (fn: (list: Conversation[]) => Conversation[]) => {
    setConversations((list) => {
      const next = fn(list);
      saveConversations(next);
      return next;
    });
  };

  const send = () => {
    const text = input.trim();
    if (!text || pending) return;
    const id = activeId ?? newId();
    const ts = Date.now();
    updateConversations((list) => {
      const existing = list.find((c) => c.id === id);
      if (existing) return list.map((c) => (c.id === id ? { ...c, updatedAt: ts, messages: [...c.messages, { role: "user", text }] } : c));
      return [{ id, title: titleFrom(text), updatedAt: ts, messages: [...draft, { role: "user", text }] }, ...list];
    });
    setActiveId(id);
    setInput("");
    setPending(true);
    setNow(ts);
    timer.current = setTimeout(() => {
      updateConversations((list) =>
        list.map((c) => (c.id === id ? { ...c, updatedAt: Date.now(), messages: [...c.messages, { role: "npc", text: DEMO_REPLY }] } : c)),
      );
      setPending(false);
    }, DEMO_DELAY_MS);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send();
  };

  // Enter 전송, Shift+Enter 줄바꿈 (한글 조합 중에는 무시)
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const startNew = () => {
    if (pending) return;
    setActiveId(null);
    setDraft([{ role: "npc", text: GREETING }]);
    setListOpen(false);
    inputRef.current?.focus();
  };

  const openConversation = (id: string) => {
    if (pending) return;
    setActiveId(id);
    setListOpen(false);
  };

  const removeConversation = (id: string) => {
    if (pending) return;
    updateConversations((list) => list.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => {});

  useEffect(() => {
    if (!listOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setListOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listOpen]);

  // 입력창 높이를 내용에 맞춤 (최대 6줄)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    // 비어 있을 때는 안내 문구 줄바꿈과 상관없이 한 줄 높이
    if (input) el.style.height = `${Math.min(el.scrollHeight, 6 * 24 + 16)}px`;
  }, [input]);

  const recentList = (
    <nav aria-label="최근 대화" className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b-4 border-ink px-3 py-3">
        <h2 className="text-sm text-gold">최근 대화</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={startNew} disabled={pending} className="px-btn bg-gold px-2 py-0.5 text-xs">
            + 새 대화
          </button>
          <button type="button" onClick={() => setListOpen(false)} aria-label="최근 대화 닫기" className="px-btn bg-cream px-1.5 py-0.5 text-xs">
            ✕
          </button>
        </div>
      </div>
      <ul className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        {conversations.length === 0 && <li className="px-2 py-6 text-center text-xs text-cream/50">아직 나눈 대화가 없어요</li>}
        {conversations.map((c) => {
          const selected = c.id === activeId;
          return (
            <li key={c.id} className={`group flex items-center ${selected ? "bg-gold/20 outline-2 outline-gold" : "hover:bg-[#3a2416]"}`}>
              <button
                type="button"
                onClick={() => openConversation(c.id)}
                aria-current={selected ? "true" : undefined}
                className="min-w-0 flex-1 px-2 py-2 text-left"
              >
                <span className={`block truncate text-sm ${selected ? "text-gold" : "text-cream"}`}>{c.title}</span>
                <span className="block text-[10px] text-cream/50">{now ? relativeTime(c.updatedAt, now) : ""}</span>
              </button>
              <button
                type="button"
                onClick={() => removeConversation(c.id)}
                aria-label={`'${c.title}' 대화 삭제`}
                className="mr-1 px-1.5 text-xs text-cream/40 opacity-0 hover:text-red focus-visible:opacity-100 group-hover:opacity-100"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    // 대화창 하나로 통으로: 제목줄 + 대화 + 입력 (최근 대화는 버튼으로 여는 서랍)
    <section className="relative flex h-full min-h-0 flex-col text-ink" style={pixelFrame("parchment", 3)}>
      <header className="flex items-center gap-2 border-b-2 border-ink/15 px-3 py-3 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={() => setListOpen((o) => !o)}
          aria-expanded={listOpen}
          aria-controls="recent-drawer"
          className="px-btn flex items-center gap-1.5 bg-wood-dark px-2 py-1 text-xs text-cream"
        >
          <span aria-hidden="true">☰</span>
          <span className="hidden sm:inline">최근 대화</span>
          {conversations.length > 0 && <span>{conversations.length}</span>}
          <span className="sr-only sm:hidden">최근 대화</span>
        </button>
        <span className="hidden bg-[#3a2416] p-1 sm:block" aria-hidden="true">
          <PixelSprite rows={npc.rows} palette={npc.palette} scale={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm sm:text-base">AI Agent · {npc.name}</h1>
          <p className="truncate text-xs text-wood-dark">{active ? active.title : "새 대화"}</p>
        </div>
        <button type="button" onClick={startNew} disabled={pending} className="px-btn hidden bg-gold px-2 py-1 text-xs sm:block">
          + 새 대화
        </button>
        <Link href="/" className="px-btn bg-cream px-2 py-1 text-xs">
          메인으로
        </Link>
      </header>

      <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div ref={contentRef} className="mx-auto flex max-w-[760px] flex-col gap-6">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <p key={i} className="max-w-[80%] self-end whitespace-pre-wrap bg-[#dcc08e] px-4 py-2 text-[15px] leading-relaxed shadow-[inset_0_-3px_0_0_#c4a36b]">
                {m.text}
              </p>
            ) : (
              <div key={i} className="flex gap-3">
                <span className="h-fit shrink-0 bg-[#3a2416] p-1" aria-hidden="true">
                  <PixelSprite rows={npc.rows} palette={npc.palette} scale={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-wood-dark">{npc.name}</p>
                  <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">
                    {i === lastIndex ? <TypeLine key={`${activeId}-${i}`} text={m.text} showCaret={!pending} /> : m.text}
                  </p>
                  {i > 0 && (
                    <button type="button" onClick={() => copy(m.text)} className="mt-1 text-[11px] text-wood-dark/70 hover:text-ink">
                      복사
                    </button>
                  )}
                </div>
              </div>
            ),
          )}
          {pending && (
            <p className="pl-12 text-sm text-wood-dark" role="status">
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

      {/* 입력 */}
      <form onSubmit={onSubmit} className="border-t-2 border-ink/15 px-2 pb-3 pt-4 sm:px-4">
        <div className="mx-auto flex max-w-[820px] items-end gap-1 px-1 py-2 sm:gap-2 sm:px-2" style={pixelFrame("wood", 2)}>
          <button type="button" aria-label="첨부" className="px-btn flex size-8 shrink-0 items-center justify-center bg-red sm:size-9">
            <PixelIcon name="plus" color="var(--color-cream)" />
          </button>
          <label htmlFor="agent-input" className="sr-only">
            메시지
          </label>
          <textarea
            id="agent-input"
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="메시지를 입력하세요…"
            className="no-scrollbar max-h-40 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-cream outline-none placeholder:text-cream/45 md:text-[15px]"
          />
          <button type="button" aria-label="음성 입력" className="px-btn flex size-8 shrink-0 items-center justify-center bg-parch sm:size-9">
            <PixelIcon name="mic" color="var(--color-ink)" scale={2} />
          </button>
          <button type="submit" aria-label="전송" disabled={pending || !input.trim()} className="px-btn flex size-8 shrink-0 items-center justify-center bg-gold sm:size-9">
            <PixelIcon name="send" color="var(--color-ink)" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-wood-dark/70">
          <span className="hidden sm:inline">Enter 전송 · Shift+Enter 줄바꿈 · </span>지금은 데모 응답입니다
        </p>
      </form>

      {/* 최근 대화 서랍 (버튼으로 열고, 바깥 클릭·Esc로 닫힘) */}
      {listOpen && (
        <>
          <button type="button" aria-label="최근 대화 닫기" onClick={() => setListOpen(false)} className="absolute inset-0 z-10 cursor-default bg-ink/35" />
          <div id="recent-drawer" className="absolute inset-y-0 left-0 z-20 flex w-[290px] max-w-[85%] flex-col text-cream" style={pixelFrame("wood", 3)}>
            {recentList}
          </div>
        </>
      )}
    </section>
  );
}
