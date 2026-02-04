
import { ChatInterface } from "@/components/ai/chat-interface";

export default function StudentAiPage() {
  return (
    <div className="h-[calc(100vh-var(--header-height))] -m-4 md:-m-6 lg:-m-8">
      <ChatInterface />
    </div>
  );
}
