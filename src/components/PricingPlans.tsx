"use client";

import { useState } from "react";
import Link from "next/link";
import { promoMenu } from "@/data/promoMenu";
import { pixelFrame } from "@/lib/pixel";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 안내 페이지 요금제: 월간/연간 전환 + 요금제 카드 (주인장 카드는 나무 간판처럼 강조) */
export default function PricingPlans() {
  const p = promoMenu.pricing;
  const [yearly, setYearly] = useState(true);

  return (
    <section className="px-6 py-10 text-ink md:px-10" style={pixelFrame("parchment", 3)}>
      <h2 className="text-balance text-center text-2xl font-bold md:text-4xl">
        {p.titleBefore}
        <span className="text-red">{p.titleHighlight}</span>
      </h2>

      {/* 월간 / 연간 */}
      <div role="radiogroup" aria-label="결제 주기" className="mx-auto mt-6 flex w-fit gap-1 bg-[#dcc08e] p-1 shadow-[inset_0_0_0_2px_#1e120a]">
        {[
          { v: false, label: p.monthlyLabel },
          { v: true, label: p.yearlyLabel },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={yearly === o.v}
            onClick={() => setYearly(o.v)}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm ${yearly === o.v ? "bg-cream shadow-[0_0_0_2px_#1e120a]" : "text-wood-dark hover:text-ink"}`}
          >
            {o.label}
            {o.v && <span className="bg-green px-1.5 text-[11px] leading-5 text-cream">{p.yearlyBadge}</span>}
          </button>
        ))}
      </div>

      <ul className="mx-auto mt-10 grid max-w-[720px] gap-8 md:grid-cols-2 md:gap-6">
        {p.plans.map((plan) => {
          const perMonth = yearly ? plan.yearlyPerMonth : plan.monthly;
          const save = (plan.monthly - plan.yearlyPerMonth) * 12;
          const dark = plan.featured;
          return (
            <li
              key={plan.id}
              className={`flex flex-col px-6 py-6 ${dark ? "text-cream drop-shadow-[0_0_18px_rgb(242_181_68/0.35)]" : "text-ink"}`}
              style={pixelFrame(dark ? "wood" : "parchment", 3)}
            >
              <p className={`text-sm tracking-[0.3em] ${dark ? "text-gold" : "text-red"}`}>{plan.name}</p>
              <p className={`mt-1 text-sm ${dark ? "text-cream/70" : "text-wood-dark"}`}>{plan.desc}</p>

              <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
                {yearly && <span className={`text-sm line-through ${dark ? "text-cream/45" : "text-wood-dark/60"}`}>{won(plan.monthly)}</span>}
                <span className="text-3xl font-bold tabular-nums">{won(perMonth)}</span>
                <span className={`text-sm ${dark ? "text-cream/60" : "text-wood-dark"}`}>/월</span>
              </p>
              <p className={`mt-1 min-h-5 text-xs ${dark ? "text-cream/60" : "text-wood-dark"}`}>
                {yearly && (
                  <>
                    {won(plan.yearlyPerMonth * 12)}/년, 연간 결제 · <span className="text-green">{won(save)} 절약</span>
                  </>
                )}
              </p>

              <Link href="/agent" className={`px-btn mt-5 block py-2 text-center text-sm ${dark ? "bg-gold text-ink" : "bg-[#3a2416] text-cream"}`}>
                {plan.cta} →
              </Link>

              <p className={`mt-4 flex items-center justify-between px-3 py-2 text-sm ${dark ? "bg-[#2a1a10]" : "bg-[#e3cc9c]"}`}>
                <span className="font-bold">{plan.credit}</span>
                <span className={`text-xs ${dark ? "text-cream/55" : "text-wood-dark"}`}>{plan.creditNote}</span>
              </p>

              <p className="mt-5 text-sm font-bold">{plan.includesTitle}</p>
              <ul className="mt-2 flex flex-1 flex-col gap-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm">
                    <span className={dark ? "text-gold" : "text-green"} aria-hidden="true">
                      ✔
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <p className={`mt-5 border-t-2 border-dashed pt-3 text-xs ${dark ? "border-cream/15 text-cream/50" : "border-ink/15 text-wood-dark/70"}`}>{plan.footnote}</p>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-center text-xs text-wood-dark/70">{p.note}</p>
    </section>
  );
}
