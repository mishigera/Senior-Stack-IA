import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Conversation, Message } from "@shared/models/chat";

// Base API URL for Replit AI integrations chat module
const API_BASE = "/api/conversations";

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: [API_BASE],
    queryFn: async () => {
      const res = await fetch(API_BASE, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
  });
}

export function useConversation(id: number | null) {
  return useQuery<Conversation & { messages: Message[] }>({
    queryKey: [API_BASE, id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete conversation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE] });
    },
  });
}

export function useChatStream(conversationId: number | null) {
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const queryClient = useQueryClient();

  const sendMessage = async (content: string) => {
    if (!conversationId) return;
    setIsStreaming(true);
    setStreamingMessage("");

    // Optimistically add user message to cache
    queryClient.setQueryData(
      [API_BASE, conversationId],
      (old: any) => ({
        ...old,
        messages: [...(old?.messages || []), { role: "user", content, createdAt: new Date().toISOString() }],
      })
    );

    try {
      const res = await fetch(`${API_BASE}/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  setStreamingMessage((prev) => prev + data.content);
                }
                if (data.done) {
                  // Re-fetch conversation to get fully saved message
                  queryClient.invalidateQueries({ queryKey: [API_BASE, conversationId] });
                }
              } catch (e) {
                // Ignore incomplete JSON parsing errors
              }
            }
          }
        }
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  return { sendMessage, streamingMessage, isStreaming };
}
