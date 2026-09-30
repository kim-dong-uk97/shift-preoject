"use client";

import { useState, type CSSProperties } from "react";
import { toolGroups, type ToolItem } from "@/data/home";
import { sampleWorks, type Work } from "@/data/works";
import { pixelFrame } from "@/lib/pixel";
import MenuIcon from "./MenuIcon";

const TOOLS = toolGroups.flatMap((g) => g.items);
const ALL = "전체";

const byTool = (tool: string) => sampleWorks.filter((w) => w.tool === tool).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
const shortDate = (d: string) => d.slice(5).replace("-", ".");

/** 작업 카드: 위는 도구 색 썸네일, 아래는 제목·날짜 */
function WorkCard({ work, tool }: { work: Work; tool: ToolItem }) {
  return (
    <li>
      <a
        href="#"
        className="group block bg-[#fffaf0] shadow-[0_0_0_2px_#1e120a] transition hover:-translate-y-0.5 hover:shadow-[0_0_0_2px_var(--tool),0_4px_0_var(--tool)]"
        style={{ "--tool": tool.color } as CSSProperties}
      >
        <span className="relative flex aspect-[16/9] items-center justify-center" style={{ background: `color-mix(in srgb, ${tool.color} 22%, #fffaf0)`, color: tool.color }}>
          <MenuIcon name={tool.icon} size={34} />
          <span className="absolute right-1.5 top-1.5 bg-ink/70 px-1 text-[10px] leading-4 text-cream">예시</span>
        </span>
        <span className="block px-3 py-2">
          <span className="block truncate text-sm font-bold text-ink">{work.title}</span>
          <span className="mt-0.5 block text-[11px] text-wood-dark">{shortDate(work.updatedAt)} 수정</span>
        </span>
      </a>
    </li>
  );
}

/** 새로 만들기 카드 (점선) */
function NewCard({ tool, wide = false }: { tool: ToolItem; wide?: boolean }) {
  return (
    <li className={wide ? "col-span-full" : ""}>
      {/* TODO(TBD): 도구별 만들기 화면 연결 */}
      <a
        href="#"
        className={`flex h-full flex-col items-center justify-center gap-1 border-2 border-dashed border-ink/35 text-wood-dark hover:border-ink hover:text-ink ${wide ? "py-6" : "min-h-[140px]"}`}
      >
        <span className="text-xl leading-none">+</span>
        <span className="text-xs">{wide ? `아직 ${tool.title}로 만든 작업이 없어요 · 첫 작업 만들기` : "새로 만들기"}</span>
      </a>
    </li>
  );
}

/** 내 작업: 위 도구별 분류 탭 + 도구마다 따로 모은 작업 목록 */
export default function WorksBoard() {
  const [filter, setFilter] = useState(ALL);
  const shown = filter === ALL ? TOOLS : TOOLS.filter((t) => t.title === filter);

  return (
    <div className="flex flex-col gap-6">
      {/* 도구별 분류 */}
      <div role="tablist" aria-label="도구별 분류" className="no-scrollbar flex gap-2 overflow-x-auto p-3" style={pixelFrame("wood", 2)}>
        {[ALL, ...TOOLS.map((t) => t.title)].map((name) => {
          const tool = TOOLS.find((t) => t.title === name);
          const count = tool ? byTool(name).length : sampleWorks.length;
          const active = filter === name;
          return (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(name)}
              className={`px-btn flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-1 text-xs ${active ? "bg-gold text-ink" : "bg-[#2a1a10] text-cream hover:bg-[#5c3620]"}`}
            >
              {tool && (
                <span style={{ color: active ? undefined : tool.color }}>
                  <MenuIcon name={tool.icon} size={14} />
                </span>
              )}
              {name}
              <span className={active ? "text-ink/60" : "text-cream/50"}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* 도구마다 따로 */}
      {shown.map((tool) => {
        const works = byTool(tool.title);
        return (
          <section key={tool.title} className="px-5 pb-5 pt-4 text-ink" style={pixelFrame("parchment", 3)}>
            <header className="mb-4 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center" style={{ background: `color-mix(in srgb, ${tool.color} 22%, transparent)`, color: tool.color }}>
                <MenuIcon name={tool.icon} size={18} />
              </span>
              <h2 className="text-base font-bold">{tool.title}</h2>
              <span className="text-sm text-wood-dark">{works.length}</span>
              {/* TODO(TBD): 도구별 만들기 화면 연결 */}
              <a href="#" className="px-btn ml-auto bg-gold px-2.5 py-1 text-xs">
                + 새로 만들기
              </a>
            </header>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {works.map((w) => (
                <WorkCard key={w.id} work={w} tool={tool} />
              ))}
              {works.length === 0 ? <NewCard tool={tool} wide /> : filter !== ALL && <NewCard tool={tool} />}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
