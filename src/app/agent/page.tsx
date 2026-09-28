import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import AgentChat from "@/components/AgentChat";

export const metadata: Metadata = {
  title: "aurora AI Agent",
  description: "NPC와 넓은 화면에서 대화하는 aurora AI Agent",
};

export default function AgentPage() {
  return (
    <div className="relative h-dvh overflow-hidden">
      <Sidebar current="agent" seasonControl={false} />
      <div className="flex h-full flex-col px-4 pb-24 pt-4 md:pb-4 md:pl-[136px] md:pr-6">
        <AgentChat />
      </div>
    </div>
  );
}
