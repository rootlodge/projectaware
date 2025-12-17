import { ChatInterface } from "@/components/chat/chat-interface"

export const metadata = {
  title: "Chat - Project Aware",
  description: "Chat with your AI assistant",
}

export default function ChatPage() {
  return (
    <div className="hidden h-full flex-col md:flex p-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chat</h2>
          <p className="text-muted-foreground">
            Interact with your AI agents here.
          </p>
        </div>
      </div>
      <div className="flex-1 h-[calc(100vh-200px)]">
         <ChatInterface />
      </div>
    </div>
  )
}
