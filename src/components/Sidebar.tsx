import Link from "next/link";
import { pixelFrame } from "@/lib/pixel";
import type { MenuIconName } from "@/lib/menuIcons";
import MenuIcon from "./MenuIcon";
import SeasonControl from "./SeasonControl";

// Tailwind가 클래스를 인식하도록 전체 문자열로 지정
export type NavId = "home" | "agent" | "work" | "learn" | "make";
type NavItem = { id: NavId; label: string; icon: MenuIconName; href: string; fill: string; hover: string };

// TODO(TBD): 배우기·만들기 페이지는 아직 없음
const navItems: NavItem[] = [
  { id: "home", label: "홈", icon: "home", href: "/", fill: "bg-gold", hover: "hover:bg-gold" },
  { id: "agent", label: "AI Agent", icon: "agent", href: "/agent", fill: "bg-red", hover: "hover:bg-red" },
  { id: "work", label: "내 작업", icon: "folder", href: "/works", fill: "bg-green", hover: "hover:bg-green" },
  { id: "learn", label: "배우기", icon: "learn", href: "#", fill: "bg-blue", hover: "hover:bg-blue" },
  { id: "make", label: "만들기", icon: "make", href: "#", fill: "bg-purple", hover: "hover:bg-purple" },
];

function NavButton({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`px-btn flex size-14 flex-col items-center justify-center gap-1 md:size-16 ${
        active ? `${item.fill} text-ink` : `bg-wood-dark text-cream hover:text-ink ${item.hover}`
      }`}
    >
      <MenuIcon name={item.icon} size={22} />
      <span className="text-[10px] leading-none">{item.label}</span>
    </Link>
  );
}

/** 모바일: 하단 탭바 / 태블릿 이상: 좌측 고정 사이드바 */
export default function Sidebar({ current = "home", seasonControl = true }: { current?: NavId; seasonControl?: boolean }) {
  return (
    <>
      <aside
        data-leaf-bound="left"
        data-leaf-perch
        className="fixed bottom-4 left-4 top-4 z-30 hidden w-[96px] flex-col items-center py-4 md:flex"
        style={pixelFrame("wood", 3)}
      >
        <div className="mb-2 text-lg text-gold">aurora</div>
        {seasonControl && <SeasonControl layout="sidebar" />}
        <nav className="flex flex-1 flex-col justify-evenly">
          {navItems.map((item) => (
            <NavButton key={item.id} item={item} active={item.id === current} />
          ))}
        </nav>
        <button type="button" aria-label="로그아웃" className="px-btn flex size-10 items-center justify-center bg-wood-dark text-cream hover:bg-cream hover:text-ink">
          <MenuIcon name="logout" size={18} />
        </button>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t-4 border-ink bg-[#3a2416] px-2 py-2 md:hidden">
        {navItems.map((item) => (
          <NavButton key={item.id} item={item} active={item.id === current} />
        ))}
      </nav>
    </>
  );
}
