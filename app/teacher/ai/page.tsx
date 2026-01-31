import { ChatInterface } from "@/components/ai/chat-interface";

export default function TeacherAiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kidokool Ai</h1>
        <p className="text-muted-foreground">
          Teacher Assistant: Ask for help with course creation, student management, or teaching tips.
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
