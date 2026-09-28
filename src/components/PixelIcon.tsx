import { icons, type IconName } from "@/lib/sprites";
import PixelSprite from "./PixelSprite";

type Props = { name: IconName; color?: string; scale?: number; className?: string };

export default function PixelIcon({ name, color = "currentColor", scale = 3, className }: Props) {
  return <PixelSprite rows={icons[name]} palette={{ x: color }} scale={scale} className={className} />;
}
