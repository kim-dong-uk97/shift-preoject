import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { promoMenu as m } from "@/data/promoMenu";
import { toolGroups } from "@/data/home";
import { CAT, CAT_PALETTE } from "@/lib/cat";
import { pixelFrame } from "@/lib/pixel";
import MenuIcon from "@/components/MenuIcon";
import PixelSprite from "@/components/PixelSprite";
import PricingPlans from "@/components/PricingPlans";

export const metadata: Metadata = {
  title: "Arvis 알아보기",
  description: "Arvis에서 AI 도구를 마음껏 쓰고 나만의 AI Agent를 만드는 방법을 소개합니다",
};

/** 간판 배경 타일: 9개 도구 아이콘을 섞어 깔고 사이사이 빈 타일 */
const TOOLS = toolGroups.flatMap((g) => g.items);
const HERO_TILES = Array.from({ length: 60 }, (_, i) => (i % 3 === 1 ? null : TOOLS[(i * 7) % TOOLS.length]));

/** 흩어진 영수증 자리·기울기 (넓은 화면) */
const SCATTER = [
  "md:left-0 md:top-0 md:-rotate-3",
  "md:left-[130px] md:top-[45px] md:rotate-2",
  "md:left-[6px] md:top-[140px] md:-rotate-2",
  "md:left-[125px] md:top-[185px] md:rotate-3",
  "md:left-[35px] md:top-[275px] md:-rotate-1",
];

const TAG_COLOR: Record<string, string> = { 인기: "bg-red text-cream", 추천: "bg-gold text-ink", NEW: "bg-green text-cream" };

/** 섹션 제목: 칠판 위 분필 글씨 느낌 (— 제목 —) */
function BoardTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="text-lg text-gold md:text-xl">— {title} —</h2>
      {lead && <p className="mt-1 text-sm text-chalk/65">{lead}</p>}
    </div>
  );
}

/** 알아보기: 선술집 메뉴판 컨셉의 서비스 안내 페이지 */
export default function GuidePage() {
  return (
    <div className="min-h-screen overflow-x-clip break-keep px-4 pb-16 pt-6 md:px-8">
      {/* 위: 메인으로 가는 집 버튼 + 가게 이름 */}
      <nav className="mx-auto flex max-w-[960px] items-center gap-3">
        <Link href="/" aria-label="메인으로" title="메인으로" className="px-btn flex size-9 items-center justify-center bg-cream text-ink hover:bg-gold">
          <MenuIcon name="home" size={20} />
        </Link>
        <span className="text-lg text-gold">Arvis</span>
      </nav>

      <main className="mx-auto mt-8 flex max-w-[960px] flex-col gap-12">
        {/* 간판: 도구 타일이 비스듬히 깔린 어두운 벽 + 가운데 큰 제목 + 추천하는 치즈냥이 */}
        <section className="relative overflow-hidden text-center text-cream" style={pixelFrame("wood", 4)}>
          <div aria-hidden="true" className="absolute inset-0 bg-[#140d08]">
            <ul className="absolute -inset-x-[15%] -inset-y-[40%] grid rotate-[-8deg] grid-cols-[repeat(auto-fill,76px)] content-center justify-center gap-4">
              {HERO_TILES.map((t, i) => (
                <li key={i} className="flex size-[76px] items-center justify-center bg-[#2a1c14] shadow-[inset_0_0_0_3px_#3d2a1d,inset_0_-6px_0_#20150e]" style={{ color: t?.color }}>
                  {t && <MenuIcon name={t.icon} size={34} className="opacity-60" />}
                </li>
              ))}
            </ul>
            {/* 글씨가 잘 읽히게 가운데를 어둡게, 가장자리는 서서히 */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_65%_at_50%_45%,rgb(20_13_8/0.94)_35%,rgb(20_13_8/0.55)_70%,rgb(20_13_8/0.2))]" />
          </div>

          <div className="relative px-6 pb-32 pt-12 md:px-12 md:pb-14 md:pt-14">
            <h1 className="break-keep text-balance text-2xl font-bold leading-tight sm:text-3xl md:text-5xl md:leading-tight">
              {m.hero.titleBefore}
              <span className="text-gold [text-shadow:0_0_18px_rgb(242_181_68/0.55)]">{m.hero.titleHighlight}</span>
              {m.hero.titleAfter}
              <br />
              {m.hero.title2}
            </h1>
            <p className="mt-5 break-keep text-balance text-sm text-cream/85 md:text-base">{m.hero.subtitle}</p>
            <p className="mt-1 text-balance text-sm text-cream/55">{m.hero.desc}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/agent" className="px-btn bg-gold px-6 py-2.5 text-sm text-ink shadow-[0_0_24px_rgb(242_181_68/0.45)]">
                {m.hero.order} ›
              </Link>
              <a href="#menu" className="px-btn bg-cream px-5 py-2.5 text-sm text-ink">
                {m.hero.browse}
              </a>
            </div>
          </div>

          {/* 추천하는 치즈냥이: 버튼 쪽을 앞발로 가리킴 */}
          <div aria-hidden="true" className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-end gap-2 md:bottom-6 md:left-10 md:translate-x-0">
            <PixelSprite rows={CAT} palette={CAT_PALETTE} scale={4} className="animate-npc md:h-[114px] md:w-auto" />
            <span className="relative mb-14 whitespace-nowrap bg-cream px-2.5 py-1 text-sm text-ink shadow-[0_0_0_3px_#1e120a] md:mb-20">
              {m.hero.bubble}
              <span className="absolute right-full top-1/2 size-0 -translate-y-1/2 border-y-[6px] border-r-[8px] border-y-transparent border-r-[#1e120a]" />
            </span>
          </div>
        </section>

        {/* 흩어진 AI 가게 영수증 → Arvis 한 테이블 */}
        <section className="px-6 py-10 text-ink md:px-10" style={pixelFrame("parchment", 3)}>
          <div className="text-center">
            <h2 className="text-balance text-2xl font-bold md:text-4xl">
              {m.compare.titleBefore}
              <span className="text-red">{m.compare.titleHighlight}</span>
            </h2>
            <p className="mt-3 text-balance text-sm text-wood-dark md:text-base">{m.compare.subtitle}</p>
          </div>

          <div className="mt-10 flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-0">
            {/* 왼쪽: 비스듬히 흩어진 영수증 */}
            <div className="flex flex-col items-center">
              <ul className="grid grid-cols-2 gap-3 md:relative md:block md:h-[380px] md:w-[330px]">
                {m.compare.scattered.map((c, i) => (
                  <li
                    key={c.name}
                    className={`w-full bg-[#fffaf0] px-3 pb-2 pt-2.5 shadow-[0_0_0_2px_#1e120a,4px_4px_0_rgb(30_18_10/0.25)] md:absolute md:w-[190px] ${SCATTER[i % SCATTER.length]}`}
                  >
                    <p className="border-b-2 border-dashed border-ink/20 pb-1.5 text-center text-sm font-bold">{c.name}</p>
                    <ul className="mt-1.5 flex flex-col gap-0.5">
                      {c.lines.map((l) => (
                        <li key={l} className="flex items-center gap-2 text-xs text-wood-dark">
                          <span className="size-2 shrink-0 rounded-full border border-wood-dark/60" aria-hidden="true" />
                          <span className="flex-1 text-center">{l}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs tracking-[0.3em] text-wood-dark/70">{m.compare.scatteredLabel}</p>
            </div>

            {/* 가운데: 한 점으로 모이는 줄 (넓은 화면) / 아래 화살표 (좁은 화면) */}
            <svg aria-hidden="true" viewBox="0 0 170 380" className="hidden h-[380px] w-[170px] shrink-0 md:block">
              {[40, 115, 190, 265, 340].map((y) => (
                <path key={y} d={`M0 ${y} C 95 ${y}, 105 190, 170 190`} fill="none" stroke="#c9912e" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="6 4" />
              ))}
              <circle cx="168" cy="190" r="4" fill="#c9912e" />
            </svg>
            <span className="text-2xl text-gold md:hidden" aria-hidden="true">
              ▼
            </span>

            {/* 오른쪽: Arvis 한 테이블 */}
            <div className="w-full max-w-[320px] px-6 py-6 text-center text-cream drop-shadow-[0_0_22px_rgb(242_181_68/0.45)]" style={pixelFrame("wood", 3)}>
              <p className="flex items-center justify-center gap-2 text-2xl text-gold">
                <PixelSprite rows={CAT} palette={CAT_PALETTE} scale={2} />
                {m.compare.merged.name}
              </p>
              <p className="mt-2 text-sm">{m.compare.merged.tagline}</p>
              <ul className="mt-4 flex flex-col gap-2 border-t-2 border-cream/15 pt-4">
                {m.compare.merged.points.map((pt) => (
                  <li key={pt} className="flex items-center justify-center gap-2 text-sm text-cream/85">
                    <span className="text-gold" aria-hidden="true">
                      ✦
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 요금제 */}
        <PricingPlans />

        {/* 도구 작업실: 왼쪽 큰 제목 + 오른쪽 도구 타일 (마지막 칸은 점선 "더 보기") */}
        <section className="grid items-center gap-8 px-6 py-10 text-ink md:grid-cols-[1fr_1.15fr] md:gap-10 md:px-10" style={pixelFrame("parchment", 3)}>
          <div>
            <h2 className="text-2xl font-bold leading-snug md:text-3xl md:leading-snug">
              {m.workspace.titleLine1}
              <br />
              <span className="text-red">{m.workspace.titleLine2}</span>
            </h2>
            <p className="mt-4 max-w-[420px] text-sm leading-relaxed text-wood-dark">{m.workspace.desc}</p>
          </div>
          <ul className="grid grid-cols-2 gap-3">
            {TOOLS.map((t) => (
              <li key={t.title}>
                <Link
                  href="/"
                  className="group flex items-center gap-2 bg-[#fffaf0] px-2.5 py-3 sm:gap-3 sm:px-3 shadow-[0_0_0_2px_#1e120a] transition hover:-translate-y-0.5 hover:shadow-[0_0_0_2px_var(--tool),0_4px_0_var(--tool)]"
                  style={{ "--tool": t.color } as CSSProperties}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center" style={{ background: `color-mix(in srgb, ${t.color} 22%, transparent)`, color: t.color }}>
                    <MenuIcon name={t.icon} size={18} />
                  </span>
                  <span className="whitespace-nowrap text-sm font-bold">{t.title}</span>
                </Link>
              </li>
            ))}
            <li>
              <a href="#menu" className="flex h-full items-center gap-2 border-2 border-dashed px-2.5 sm:gap-3 sm:px-3 border-ink/40 py-3 text-wood-dark hover:border-ink hover:text-ink">
                <span className="flex size-8 shrink-0 items-center justify-center bg-ink/10 text-sm tracking-widest" aria-hidden="true">
                  ···
                </span>
                <span className="whitespace-nowrap text-sm font-bold">{m.workspace.moreLabel}</span>
              </a>
            </li>
          </ul>
        </section>

        {/* 활용법: 점선으로 이어지는 칠판 목록 */}
        <section id="menu" className="scroll-mt-6 px-6 py-8 text-chalk md:px-12" style={pixelFrame("chalkboard", 3)}>
          <BoardTitle title={m.specials.title} lead={m.specials.lead} />
          <ul className="mx-auto flex max-w-[640px] flex-col gap-6">
            {m.specials.items.map((s) => (
              <li key={s.name} className="flex gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center border-2 border-chalk/40 text-gold">
                  <MenuIcon name={s.icon} size={26} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-end gap-2">
                    <span className="text-base">{s.name}</span>
                    <span className="leader" aria-hidden="true" />
                    {s.tag && <span className={`px-1.5 text-xs leading-5 ${TAG_COLOR[s.tag] ?? "bg-wood-dark text-cream"}`}>{s.tag}</span>}
                  </div>
                  <p className="mt-1 text-sm text-chalk/65">{s.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 이런 손님께 추천 + 자주 묻는 질문 */}
        <div className="grid gap-12 md:grid-cols-2 md:gap-8">
          <section className="px-6 py-7 text-ink" style={pixelFrame("parchment", 3)}>
            <h2 className="mb-4 text-center text-lg">{m.audience.title}</h2>
            <ul className="flex flex-col gap-3">
              {m.audience.items.map((a) => (
                <li key={a} className="flex gap-2 text-sm">
                  <span className="text-red" aria-hidden="true">
                    ✔
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </section>

          <section className="px-6 py-7 text-cream" style={pixelFrame("wood", 3)}>
            <h2 className="mb-4 text-center text-lg text-gold">{m.faq.title}</h2>
            <div className="flex flex-col gap-2">
              {m.faq.items.map((f) => (
                <details key={f.q} className="group bg-[#2a1a10] px-3 py-2">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-sm">
                    <span className="text-gold">Q.</span>
                    <span className="flex-1">{f.q}</span>
                    <span className="text-xs text-cream/60 group-open:rotate-180" aria-hidden="true">
                      ▼
                    </span>
                  </summary>
                  <p className="mt-2 border-t border-cream/15 pt-2 text-sm text-cream/75">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        {/* 맨 아래 시작 권유 */}
        <section className="px-6 py-8 text-center text-ink" style={pixelFrame("parchment", 3)}>
          <h2 className="text-balance text-xl font-bold">{m.cta.title}</h2>
          <p className="mt-1 text-sm text-wood-dark">{m.cta.desc}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/agent" className="px-btn bg-gold px-5 py-2 text-sm">
              {m.cta.order}
            </Link>
            <Link href="/" className="px-btn bg-cream px-5 py-2 text-sm">
              {m.cta.home}
            </Link>
          </div>
          <p className="mt-6 text-xs text-wood-dark/70">{m.note}</p>
        </section>
      </main>
    </div>
  );
}
