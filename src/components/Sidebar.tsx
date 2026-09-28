import { pixelFrame } from "@/lib/pixel";
import type { MenuIconName } from "@/lib/menuIcons";
import MenuIcon from "./MenuIcon";

// Tailwind가 클래스를 인식하도록 전체 문자열로 지정
type NavItem = { label: string; icon: MenuIconName; fill: string; hover: string; active?: boolean };

const navItems: NavItem[] = [
  { label: "홈", icon: "home", fill: "bg-gold", hover: "hover:bg-gold", active: true },
  { label: "AI Agent", icon: "agent", fill: "bg-red", hover: "hover:bg-red" },
  { label: "일하기", icon: "work", fill: "bg-green", hover: "hover:bg-green" },
  { label: "배우기", icon: "learn", fill: "bg-blue", hover: "hover:bg-blue" },
  { label: "만들기", icon: "make", fill: "bg-purple", hover: "hover:bg-purple" },
];

function NavButton({ item }: { item: NavItem }) {
  return (
    <a
      href="#"
      aria-current={item.active ? "page" : undefined}
      className={`px-btn flex size-14 flex-col items-center justify-center gap-1 md:size-16 ${
        item.active ? `${item.fill} text-ink` : `bg-wood-dark text-cream hover:text-ink ${item.hover}`
      }`}
    >
      <MenuIcon name={item.icon} size={22} />
      <span className="text-[10px] leading-none">{item.label}</span>
    </a>
  );
}

/** 모바일: 하단 탭바 / 태블릿 이상: 좌측 고정 사이드바 */
export default function Sidebar() {
  return (
    <>
      <aside
        className="fixed bottom-4 left-4 top-4 z-30 hidden w-[96px] flex-col items-center py-4 md:flex"
        style={pixelFrame("wood", 3)}
      >
        <div className="mb-2 text-lg text-gold">aurora</div>
        <nav className="flex flex-1 flex-col justify-evenly">
          {navItems.map((item) => (
            <NavButton key={item.label} item={item} />
          ))}
        </nav>
        <button type="button" aria-label="로그아웃" className="px-btn flex size-10 items-center justify-center bg-wood-dark text-cream hover:bg-cream hover:text-ink">
          <MenuIcon name="logout" size={18} />
        </button>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t-4 border-ink bg-[#3a2416] px-2 py-2 md:hidden">
        {navItems.map((item) => (
          <NavButton key={item.label} item={item} />
        ))}
      </nav>
    </>
  );
}
