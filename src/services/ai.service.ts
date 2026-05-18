import { api } from "@/lib/api"

export type ChatRole = "user" | "assistant"

export interface ChatMessage {
  role: ChatRole
  content: string
}

interface ChatResponse {
  data: {
    reply: string
    provider: string
    model: string
  }
}

export async function sendChatMessage(
  messages: ChatMessage[],
  token: string,
): Promise<string> {
  const res = await api<ChatResponse>("/ai/chat", {
    method: "POST",
    token,
    body: { messages },
  })
  return res.data.reply
}
