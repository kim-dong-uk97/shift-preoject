import { toolCategories } from "@/data/home";
import { pixelFrame } from "@/lib/pixel";
import { gemRows, INK } from "@/lib/sprites";
import PixelSprite from "./PixelSprite";
import PixelIcon from "./PixelIcon";
import MenuIcon from "./MenuIcon";
import PlaqueXmas from "./PlaqueXmas";

export default function BestTools() {
  return (
    <section className="mt-2 shrink-0 xl:mt-5 short:mt-1">
      <h2 data-leaf-perch className="relative mx-auto mb-8 short:mb-6 w-fit px-5 py-1 text-base text-gold" style={pixelFrame("wood", 2)}>
        BEST AI 도구
        {/* 크리스마스 모드: 화환 + 별 */}
        <PlaqueXmas />
      </h2>

      <div className="grid gap-12 md:grid-cols-3 md:gap-5">
        {toolCategories.map((cat) => (
          <article key={cat.title} data-leaf-perch className="relative flex flex-col px-4 pb-3 pt-7" style={pixelFrame("chalkboard", 3)}>
            {/* 메뉴판 위에 걸린 이름표 */}
            <header
              className="absolute -top-6 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap px-3 py-1 text-ink"
              style={pixelFrame("parchment", 2)}
            >
              <span style={{ color: cat.color }}>
                <MenuIcon name={cat.icon} size={18} />
              </span>
              <h3 className="text-base font-bold">{cat.title}</h3>
            </header>

            <p className="mb-2 text-center text-[10px] tracking-[0.3em] text-chalk/40 short:hidden">~ MENU ~</p>

            <ul className="flex flex-1 flex-col gap-2.5">
              {cat.items.map((item) => (
                <li key={item.title}>
                  <a href="#" className="group block text-chalk">
                    <span className="flex items-end gap-2">
                      <PixelSprite
                        rows={gemRows}
                        palette={{ o: INK, x: item.color, h: "#fff8e6" }}
                        scale={2}
                        className="mb-1 shrink-0 transition-transform group-hover:-translate-y-0.5"
                      />
                      <span className="min-w-0 truncate text-sm group-hover:text-gold" title={item.title}>{item.title}</span>
                      <span className="leader" />
                      <span className="text-xs text-gold/80 group-hover:text-gold">▶</span>
                    </span>
                    <span className="block truncate pl-[22px] text-xs leading-snug text-chalk/55 short:hidden" title={item.desc}>{item.desc}</span>
                  </a>
                </li>
              ))}
            </ul>

            <button type="button" className="px-btn mx-auto mt-3 flex items-center gap-2 bg-parch px-3 py-1 text-xs">
              더 알아보기
              <PixelIcon name="arrowDown" color="var(--color-ink)" scale={2} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
