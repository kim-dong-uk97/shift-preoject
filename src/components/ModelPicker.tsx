"use client";

import { useEffect, useRef, useState } from "react";
import { defaultModel, loadModel, models, saveModel, type AiModel } from "@/data/models";
import { pixelFrame } from "@/lib/pixel";

/** AI Agent 입력칸 위의 모델 고르기 (버튼 → 위로 펼쳐지는 목록, 바깥 클릭·Esc로 닫힘) */
export default function ModelPicker() {
  const [model, setModel] = useState<AiModel>(defaultModel);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // 저장된 모델 불러오기 (첫 렌더는 기본값으로 맞춰 하이드레이션 불일치 방지)
  useEffect(() => {
    const t = setTimeout(() => setModel(loadModel()), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    selectedRef.current?.focus();
    const onDown = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (m: AiModel) => {
    setModel(m);
    saveModel(m);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`모델: ${model.name}`}
        className="px-btn flex h-8 items-center gap-1.5 bg-parch px-2 text-xs [-webkit-text-stroke:0.4px_currentColor] sm:h-9"
      >
        <span>모델</span>
        <span>{model.name}</span>
        <span aria-hidden="true" className="text-[10px]">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <ul role="listbox" aria-label="모델 선택" className="absolute bottom-full left-0 z-30 mb-2 w-60 p-1 text-cream" style={pixelFrame("wood", 2)}>
          {models.map((m) => {
            const selected = m.id === model.id;
            return (
              <li key={m.id}>
                <button
                  ref={selected ? selectedRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(m)}
                  className={`flex w-full items-start gap-2 px-2 py-2 text-left outline-none hover:bg-[#3a2416] focus-visible:bg-[#3a2416] ${selected ? "bg-gold/20" : ""}`}
                >
                  <span aria-hidden="true" className={`mt-0.5 w-3 text-xs ${selected ? "text-gold" : "text-transparent"}`}>
                    ✔
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className={selected ? "text-gold" : ""}>{m.name}</span>
                      <span className="bg-ink/40 px-1 text-[10px] text-cream/70">{m.vendor}</span>
                    </span>
                    <span className="block text-[11px] text-cream/60">{m.desc}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
