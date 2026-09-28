"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { characters, type Character } from "@/data/characters";
import { pixelFrame } from "@/lib/pixel";
import PixelSprite from "./PixelSprite";

type Props = {
  open: boolean;
  selectedId: string;
  onSelect: (c: Character) => void;
  onClose: () => void;
};

/** 대화창 NPC 교체 창 */
export default function CharacterPicker({ open, selectedId, onSelect, onClose }: Props) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    selectedRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        className="w-full max-w-[520px] text-cream"
        style={pixelFrame("wood", 3)}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b-4 border-ink px-4 py-3">
          <h2 id="picker-title" className="text-base text-gold">
            ✦ 동료 선택
          </h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="px-btn flex size-8 items-center justify-center bg-cream text-sm">
            ✕
          </button>
        </header>

        <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4" role="radiogroup" aria-label="대화할 NPC">
          {characters.map((c) => {
            const selected = c.id === selectedId;
            return (
              <li key={c.id}>
                <button
                  ref={selected ? selectedRef : undefined}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelect(c)}
                  className={`group flex w-full flex-col items-center gap-2 px-2 pb-2 pt-3 transition-colors ${
                    selected ? "bg-gold/20 outline-4 outline-gold" : "bg-[#2a1a10] hover:bg-[#3a2416]"
                  }`}
                >
                  <PixelSprite rows={c.rows} palette={c.palette} scale={4} className="transition-transform group-hover:-translate-y-1" />
                  <span className={`text-sm ${selected ? "text-gold" : ""}`}>{c.name}</span>
                  <span className="text-[11px] text-cream/55">{c.role}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
