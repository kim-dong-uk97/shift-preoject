import type { Metadata } from "next";
import AgentChat from "@/components/AgentChat";

export const metadata: Metadata = {
  title: "Abyss AI Agent",
  description: "NPC와 넓은 화면에서 대화하는 Abyss AI Agent",
};

/** AI Agent: 왼쪽 메뉴 바 없이 대화에 집중, 화면 전체를 양피지색으로 트이게 (메인 이동은 왼쪽 집 버튼) */
export default function AgentPage() {
  return (
    <div className="relative h-dvh overflow-hidden bg-parch">
      <AgentChat />
    </div>
  );
}
