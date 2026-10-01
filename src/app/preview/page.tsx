import type { Metadata } from "next";
import LauncherPreview from "@/components/LauncherPreview";

export const metadata: Metadata = {
  title: "Arvis 런처 미리보기",
  robots: { index: false },
};

/** 개발 확인용: PC방 런처 목업 위 ① 영역에 메인 화면 배치 */
export default function PreviewPage() {
  return <LauncherPreview />;
}
