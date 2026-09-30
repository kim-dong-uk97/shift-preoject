"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import PixelSprite from "./PixelSprite";
import PixelIcon from "./PixelIcon";
import TypeLine from "./TypeLine";
import MenuIcon from "./MenuIcon";
import ModelPicker from "./ModelPicker";
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
import { loadModel } from "@/data/models";
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
  // 대화 이름 바꾸기: 편집 중인 대화 id와 입력값
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [now, setNow] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // 불러온 폴더 (TODO(TBD): 업로드·AI 전달 방식 확정 후 files를 실제로 보냄. 지금은 이름·개수만 표시)
  const [folders, setFolders] = useState<{ name: string; files: File[] }[]>([]);
  const folderInputRef = useRef<HTMLInputElement>(null);

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

  const folderLabel = (f: { name: string; files: File[] }) => `${f.name} · ${f.files.length}개 파일`;

  const onPickFolder = (list: FileList | null) => {
    const files = list ? [...list] : [];
    if (!files.length) return;
    const name = files[0].webkitRelativePath.split("/")[0] || "폴더";
    setFolders((prev) => [...prev.filter((f) => f.name !== name), { name, files }]);
    inputRef.current?.focus();
  };

  const send = () => {
    const text = input.trim();
    if ((!text && !folders.length) || pending) return;
    const sentFolders = folders.length ? folders.map(folderLabel) : undefined;
    const userMsg: ChatMessage = { role: "user", text, ...(sentFolders && { folders: sentFolders }) };
    const id = activeId ?? newId();
    const ts = Date.now();
    updateConversations((list) => {
      const existing = list.find((c) => c.id === id);
      if (existing) return list.map((c) => (c.id === id ? { ...c, updatedAt: ts, messages: [...c.messages, userMsg] } : c));
      return [{ id, title: titleFrom(text || folders[0].name), updatedAt: ts, messages: [...draft, userMsg] }, ...list];
    });
    setActiveId(id);
    setInput("");
    setFolders([]);
    setPending(true);
    setNow(ts);
    // 입력칸 위에서 고른 모델. TODO(TBD): AI 연동 시 model.id를 요청에 실어 보내고 아래 데모 응답을 실제 응답으로 교체
    const model = loadModel();
    void model;
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

  const startRename = (c: Conversation) => {
    setEditingId(c.id);
    setEditValue(c.title);
  };

  /** 이름 저장 (비워 두면 원래 이름 유지, 목록 순서는 그대로) */
  const commitRename = () => {
    if (!editingId) return;
    const title = editValue.trim().slice(0, 40);
    if (title) updateConversations((list) => list.map((c) => (c.id === editingId ? { ...c, title } : c)));
    setEditingId(null);
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

  /** 메인으로 가는 집 버튼 (메인 화면처럼 왼쪽 동선에 둠) */
  const homeButton = (className = "") => (
    <Link href="/" aria-label="메인으로" title="메인으로" className={`px-btn flex size-8 shrink-0 items-center justify-center bg-cream text-ink hover:bg-gold ${className}`}>
      <MenuIcon name="home" size={18} />
    </Link>
  );

  /** 최근 대화 목록 (inDrawer: 좁은 화면 서랍용 → 닫기 버튼 표시, 홈 버튼은 제목줄에 있으므로 생략) */
  const renderRecent = (inDrawer: boolean) => (
    <nav aria-label="최근 대화" className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b-4 border-ink px-3 py-3">
        <div className="flex items-center gap-2">
          {!inDrawer && homeButton()}
          <h2 className="text-sm text-gold">최근 대화</h2>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={startNew} disabled={pending} className="px-btn bg-gold px-2 py-0.5 text-xs">
            + 새 대화
          </button>
          {inDrawer && (
            <button type="button" onClick={() => setListOpen(false)} aria-label="최근 대화 닫기" className="px-btn bg-cream px-1.5 py-0.5 text-xs">
              ✕
            </button>
          )}
        </div>
      </div>
      <ul className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        {conversations.length === 0 && <li className="px-2 py-6 text-center text-xs text-cream/50">아직 나눈 대화가 없어요</li>}
        {conversations.map((c) => {
          const selected = c.id === activeId;
          return (
            <li key={c.id} className={`group flex items-center ${selected ? "bg-gold/20 outline-2 outline-gold" : "hover:bg-[#4a2f1c]"}`}>
              {editingId === c.id ? (
                // 이름 편집: Enter·바깥 클릭 저장, Esc 취소
                <div className="min-w-0 flex-1 px-2 py-1.5">
                  <label htmlFor={`rename-${c.id}`} className="sr-only">
                    대화 이름
                  </label>
                  <input
                    id={`rename-${c.id}`}
                    autoFocus
                    value={editValue}
                    maxLength={40}
                    onChange={(e) => setEditValue(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing) return;
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setEditingId(null);
                      }
                    }}
                    className="w-full border-2 border-gold bg-[#1a110b] px-1.5 py-0.5 text-sm text-cream outline-none"
                  />
                  <span className="mt-0.5 block text-[10px] text-cream/50">Enter 저장 · Esc 취소</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openConversation(c.id)}
                  onDoubleClick={() => startRename(c)}
                  aria-current={selected ? "true" : undefined}
                  title="더블클릭하면 이름 바꾸기"
                  className="min-w-0 flex-1 px-2 py-2 text-left"
                >
                  <span className={`block truncate text-sm ${selected ? "text-gold" : "text-cream"}`}>{c.title}</span>
                  <span className="block text-[10px] text-cream/50">{now ? relativeTime(c.updatedAt, now) : ""}</span>
                </button>
              )}
              {editingId !== c.id && (
                <>
                  <button
                    type="button"
                    onClick={() => startRename(c)}
                    aria-label={`'${c.title}' 대화 이름 바꾸기`}
                    title="이름 바꾸기"
                    className="px-1 text-xs text-cream/50 opacity-0 hover:text-gold focus-visible:opacity-100 group-hover:opacity-100 max-lg:opacity-100"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => removeConversation(c.id)}
                    aria-label={`'${c.title}' 대화 삭제`}
                    title="삭제"
                    className="mr-1 px-1.5 text-xs text-cream/40 opacity-0 hover:text-red focus-visible:opacity-100 group-hover:opacity-100 max-lg:opacity-100"
                  >
                    ✕
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    // 넓은 화면: 왼쪽에 최근 대화 늘 펼침 + 오른쪽 대화창 / 좁은 화면: 최근 대화는 버튼으로 여는 서랍
    <div className="flex h-full min-h-0">
      {/* 최근 대화: 화면 왼쪽 끝에 붙은 나무판 */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r-4 border-ink bg-[#3a2416] text-cream lg:flex">
        {renderRecent(false)}
      </aside>

      {/* 대화: 틀 없이 양피지 위에서 트이게 */}
      <section className="relative flex min-w-0 flex-1 flex-col text-ink">
        <header className="flex items-center gap-2 border-b-2 border-ink/15 px-3 py-3 sm:gap-3 sm:px-4">
          {/* 좁은 화면(최근 대화 목록이 숨겨질 때): 맨 왼쪽에 집 버튼 */}
          {homeButton("lg:hidden")}
          <button
            type="button"
            onClick={() => setListOpen((o) => !o)}
            aria-expanded={listOpen}
            aria-controls="recent-drawer"
            className="px-btn flex items-center gap-1.5 bg-wood-dark px-2 py-1 text-xs text-cream lg:hidden"
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
          <button type="button" onClick={startNew} disabled={pending} className="px-btn hidden bg-gold px-2 py-1 text-xs sm:block lg:hidden">
            + 새 대화
          </button>
        </header>

        <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div ref={contentRef} className="mx-auto flex max-w-[760px] flex-col gap-6">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex max-w-[80%] flex-col items-end gap-1 self-end">
                  {m.folders?.map((f) => (
                    <span key={f} className="flex items-center gap-1.5 bg-[#3a2416] px-2 py-1 text-xs text-cream">
                      <MenuIcon name="folder" size={14} className="text-gold" />
                      {f}
                    </span>
                  ))}
                  {m.text && (
                    <p className="whitespace-pre-wrap bg-[#dcc08e] px-4 py-2 text-[15px] leading-relaxed shadow-[inset_0_-3px_0_0_#c4a36b]">{m.text}</p>
                  )}
                </div>
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
        <form onSubmit={onSubmit} className="border-t-2 border-ink/15 px-2 pb-3 pt-3 sm:px-4">
          {/* 위: 메시지 입력 / 아래: 첨부·모델 고르기(왼쪽) + 음성·전송(오른쪽) */}
          <div className="mx-auto flex max-w-[820px] flex-col gap-1 px-1 pb-1.5 pt-2 sm:px-2" style={pixelFrame("wood", 2)}>
            {/* 불러온 폴더 칩 (✕로 빼기) */}
            {folders.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 px-1 pt-1" aria-label="불러온 폴더">
                {folders.map((f) => (
                  <li key={f.name} className="flex items-center gap-1.5 bg-[#5c3620] py-0.5 pl-2 pr-1 text-xs text-cream">
                    <MenuIcon name="folder" size={14} className="text-gold" />
                    {folderLabel(f)}
                    <button
                      type="button"
                      aria-label={`${f.name} 폴더 빼기`}
                      onClick={() => setFolders((prev) => prev.filter((x) => x.name !== f.name))}
                      className="px-1 text-cream/70 hover:text-cream"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
              className="no-scrollbar max-h-40 min-w-0 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-cream outline-none placeholder:text-cream/45 md:text-[15px]"
            />
            <div className="flex items-center gap-1 sm:gap-2">
              <button type="button" aria-label="첨부" className="px-btn flex size-8 shrink-0 items-center justify-center bg-red sm:size-9">
                <PixelIcon name="plus" color="var(--color-cream)" />
              </button>
              {/* 폴더 불러오기: 폴더를 고르면 안의 파일을 한꺼번에 가져옴 */}
              <button
                type="button"
                aria-label="폴더 불러오기"
                title="폴더 불러오기"
                onClick={() => folderInputRef.current?.click()}
                className="px-btn flex size-8 shrink-0 items-center justify-center bg-gold text-ink sm:size-9"
              >
                <MenuIcon name="folder" size={18} />
              </button>
              <input
                ref={(el) => {
                  folderInputRef.current = el;
                  el?.setAttribute("webkitdirectory", "");
                }}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  onPickFolder(e.target.files);
                  e.target.value = "";
                }}
              />
              {/* 모델 고르기 (TODO(TBD): 실제 모델 연동 시 선택값을 요청에 실어 보냄) */}
              <ModelPicker />
              <span className="flex-1" />
              <button type="button" aria-label="음성 입력" className="px-btn flex size-8 shrink-0 items-center justify-center bg-parch sm:size-9">
                <PixelIcon name="mic" color="var(--color-ink)" scale={2} />
              </button>
              <button type="submit" aria-label="전송" disabled={pending || (!input.trim() && !folders.length)} className="px-btn flex size-8 shrink-0 items-center justify-center bg-gold sm:size-9">
                <PixelIcon name="send" color="var(--color-ink)" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-wood-dark/70">
            <span className="hidden sm:inline">Enter 전송 · Shift+Enter 줄바꿈 · </span>지금은 데모 응답입니다
          </p>
        </form>

        {/* 최근 대화 서랍 (버튼으로 열고, 바깥 클릭·Esc로 닫힘) */}
        {listOpen && (
          <div className="lg:hidden">
            <button type="button" aria-label="최근 대화 닫기" onClick={() => setListOpen(false)} className="absolute inset-0 z-10 cursor-default bg-ink/35" />
            <div id="recent-drawer" className="absolute inset-y-0 left-0 z-20 flex w-[290px] max-w-[85%] flex-col text-cream" style={pixelFrame("wood", 3)}>
              {renderRecent(true)}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
