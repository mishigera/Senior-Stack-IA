import { useState, useRef, useEffect } from "react";
import { useConversations, useConversation, useCreateConversation, useDeleteConversation, useChatStream } from "@/hooks/use-chat";
import { SectionTitle, Card, PrimaryButton } from "@/components/ui-wrappers";
import { MessageSquare, Plus, Send, Bot, User as UserIcon, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AgentPage() {
  const { data: conversations, isLoading: isConvosLoading } = useConversations();
  const [activeId, setActiveId] = useState<number | null>(null);
  const { data: activeConvo, isLoading: isChatLoading } = useConversation(activeId);
  const createMutation = useCreateConversation();
  const deleteMutation = useDeleteConversation();
  
  const { sendMessage, streamingMessage, isStreaming } = useChatStream(activeId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvo?.messages, streamingMessage]);

  const handleCreate = () => {
    createMutation.mutate("New Assistant Chat", {
      onSuccess: (data) => setActiveId(data.id)
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sidebar: Conversations */}
      <Card className="w-80 flex flex-col p-4 shadow-sm">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Chats
          </h3>
          <button 
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {isConvosLoading && <div className="text-center py-4"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>}
          
          {conversations?.map((c) => (
            <div 
              key={c.id} 
              onClick={() => setActiveId(c.id)}
              className={cn(
                "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border",
                activeId === c.id 
                  ? "bg-primary/5 border-primary/20 text-primary font-medium" 
                  : "bg-transparent border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="truncate flex-1 pr-2 text-sm">{c.title}</div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(c.id, {
                    onSuccess: () => { if (activeId === c.id) setActiveId(null); }
                  });
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {!conversations?.length && !isConvosLoading && (
            <div className="text-center text-sm text-muted-foreground py-8">
              No conversations yet. Create one to begin.
            </div>
          )}
        </div>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col p-0 overflow-hidden shadow-md">
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <SectionTitle className="mb-2">Nexus Agent</SectionTitle>
            <p className="text-muted-foreground max-w-md">
              Your intelligent assistant. Select a conversation on the left or create a new one to start interacting.
            </p>
            <PrimaryButton onClick={handleCreate} className="mt-8">
              Start New Chat
            </PrimaryButton>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-16 border-b border-border flex items-center px-6 bg-muted/20">
              <h3 className="font-medium text-foreground">{activeConvo?.title || 'Loading...'}</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isChatLoading && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
              
              {activeConvo?.messages?.map((m, i) => (
                <div key={i} className={cn("flex gap-4", m.role === "user" ? "flex-row-reverse" : "")}>
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent/10 text-accent"
                  )}>
                    {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-5 py-3.5 text-sm prose-chat",
                    m.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted text-foreground border border-border rounded-tl-none"
                  )}>
                    {m.content.split('\n').map((line, idx) => (
                      <p key={idx} className="min-h-[1em]">{line}</p>
                    ))}
                  </div>
                </div>
              ))}

              {/* Streaming Message */}
              {isStreaming && streamingMessage && (
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-accent/10 text-accent">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-tl-none px-5 py-3.5 text-sm prose-chat bg-muted text-foreground border border-border">
                    {streamingMessage.split('\n').map((line, idx) => (
                      <p key={idx} className="min-h-[1em]">{line}</p>
                    ))}
                    <span className="inline-block w-1.5 h-4 ml-1 bg-accent animate-pulse" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-background border-t border-border">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the agent anything..."
                  className="w-full bg-muted border border-border rounded-full pl-6 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  disabled={isStreaming}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="absolute right-2 p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
