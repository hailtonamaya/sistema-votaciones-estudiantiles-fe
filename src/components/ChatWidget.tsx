import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { useLocation } from "react-router-dom"
import { Bot, Loader, MessageSquare, Send, Sparkle, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { sendChatMessage, type ChatMessage } from "@/services/ai.service"
import { BRAND } from "@/lib/brand"

type ChatEntry = ChatMessage & { id: string }

const WELCOME_STUDENT: ChatEntry = {
  id: "welcome",
  role: "assistant",
  content:
    "¡Hola! Soy el asistente de Elecciones UNITEC. Puedo explicarte cómo funciona el proceso de votación, los códigos OTP, los estados de una elección y resolver dudas frecuentes. ¿En qué te ayudo?",
}

const WELCOME_ADMIN: ChatEntry = {
  id: "welcome",
  role: "assistant",
  content:
    "¡Hola! Soy el asistente administrativo de Elecciones UNITEC. Puedo ayudarte con la creación y gestión de elecciones, asociaciones, votantes y configuración del sistema. ¿En qué te ayudo?",
}

const SUGGESTIONS_STUDENT = [
  "¿Cómo voto?",
  "No me llegó el código OTP",
  "¿Puedo cambiar mi voto?",
  "¿El voto es secreto?",
]

const SUGGESTIONS_ADMIN = [
  "¿Cómo crear una elección?",
  "¿Cómo importar votantes?",
  "¿Cómo activar una elección?",
  "¿Qué estados tiene una elección?",
]

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}

function MessageBubble({ message }: { message: ChatEntry }) {
  const isUser = message.role === "user"
  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-md text-white"
            : "rounded-bl-md bg-white text-gray-800 ring-1 ring-gray-200",
        )}
        style={isUser ? { backgroundColor: BRAND } : undefined}
      >
        {message.content.split("\n").map((line, i) => (
          <p key={i} className={i === 0 ? "" : "mt-1"}>
            {renderInline(line)}
          </p>
        ))}
      </div>
    </div>
  )
}

export function ChatWidget() {
  const { token, user } = useAuth()
  const { pathname } = useLocation()
  const isAdmin = user?.role === "admin"
  const welcome = isAdmin ? WELCOME_ADMIN : WELCOME_STUDENT
  const suggestions = isAdmin ? SUGGESTIONS_ADMIN : SUGGESTIONS_STUDENT

  const hasFixedBottomBar = pathname.includes("/wizard")
  const bottomPos = hasFixedBottomBar ? "bottom-24" : "bottom-6"

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatEntry[]>([welcome])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        scrollerRef.current?.scrollTo({
          top: scrollerRef.current.scrollHeight,
          behavior: "smooth",
        })
        inputRef.current?.focus()
      })
    }
  }, [open, messages.length, sending])

  if (!token || !["student", "admin"].includes(user?.role ?? "")) return null

  async function send(content: string) {
    const trimmed = content.trim()
    if (!trimmed || sending) return
    setError(null)
    const next: ChatEntry[] = [...messages, { id: crypto.randomUUID(), role: "user", content: trimmed }]
    setMessages(next)
    setInput("")
    setSending(true)
    try {
      const history: ChatMessage[] = next.filter((m) => m.id !== "welcome").map(({ role, content }) => ({ role, content }))
      const reply = await sendChatMessage(history, token!)
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: reply }])
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : "No pude conectar con el asistente. Intenta de nuevo."
      setError(msg)
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: "Tuve un problema procesando tu pregunta. Intenta de nuevo en un momento." },
      ])
    } finally {
      setSending(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    send(input)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label="Abrir asistente de votación"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-white shadow-lg ring-1 ring-black/5 transition hover:opacity-90 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            bottomPos,
          )}
          style={{ backgroundColor: BRAND }}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-sm font-medium">Asistente</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Asistente de votación"
          className={cn(
            "fixed right-6 z-50 flex max-h-[calc(100dvh-3rem)] h-[34rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-[#F6F8FC] shadow-2xl ring-1 ring-black/10",
            bottomPos,
          )}
        >
          <header className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: BRAND }}>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <Bot className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">Asistente UNITEC</p>
                <p className="flex items-center gap-1 text-[11px] text-white/70">
                  <Sparkle className="h-2.5 w-2.5" />
                  {isAdmin ? "IA · Panel administrativo" : "IA · Proceso de votación"}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Cerrar asistente"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div
            ref={scrollerRef}
            className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
          >
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-sm text-gray-500 shadow-sm ring-1 ring-gray-200">
                  <Loader className="h-3.5 w-3.5 animate-spin" />
                  <span>Pensando…</span>
                </div>
              </div>
            )}

            {messages.length === 1 && !sending && (
              <div className="pt-1">
                <p className="px-1 pb-2 text-[11px] uppercase tracking-wide text-gray-500">
                  Preguntas frecuentes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-brand/20 transition hover:text-white"
                      style={{ color: BRAND }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-3 py-1.5 text-[11px] text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="flex items-end gap-2 border-t border-gray-200 bg-white px-3 py-2.5"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={2000}
              placeholder="Escribe tu pregunta…"
              className="max-h-32 flex-1 resize-none rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Enviar mensaje"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
              style={{ backgroundColor: input.trim() && !sending ? BRAND : undefined }}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
