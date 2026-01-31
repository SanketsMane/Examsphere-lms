import { ChatInterface } from "@/components/ai/chat-interface";

export default function StudentAiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kidokool Ai</h1>
        <p className="text-muted-foreground">
          Student Assistant: Get help with your courses, study tips, or platform navigation.
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
