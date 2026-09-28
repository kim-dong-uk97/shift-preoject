import { menuIcons, type MenuIconName } from "@/lib/menuIcons";

type Props = { name: MenuIconName; size?: number; className?: string };

// 아이콘 SVG는 저장소에 포함된 고정 문자열(외부 입력 아님)이라 그대로 삽입
export default function MenuIcon({ name, size = 24, className }: Props) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      dangerouslySetInnerHTML={{ __html: menuIcons[name] }}
    />
  );
}
