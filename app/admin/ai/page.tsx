import { ChatInterface } from "@/components/ai/chat-interface";

export default function AdminAiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kidokool Ai</h1>
        <p className="text-muted-foreground">
          Admin Assistant: Ask questions about platform management, users, or system status.
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
