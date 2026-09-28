"use client";

import { useEffect, useState } from "react";

/** 게임 대사처럼 한 글자씩 출력 */
export default function TypeLine({ text, showCaret }: { text: string; showCaret: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = reduced ? text.length : 1;
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) clearInterval(id);
        return Math.min(c + step, text.length);
      });
    }, 35);
    return () => clearInterval(id);
  }, [text]);

  const done = count >= text.length;
  return (
    <>
      {text.slice(0, count)}
      {done && showCaret && <span className="animate-caret ml-1 inline-block text-red">▼</span>}
    </>
  );
}
