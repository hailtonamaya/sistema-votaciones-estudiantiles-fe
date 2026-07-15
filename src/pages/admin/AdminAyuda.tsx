import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { useNavigate } from "react-router-dom"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import { sendChatMessage, type ChatMessage } from "@/services/ai.service"
import { ApiError } from "@/lib/api"
import { BRAND, ACCENT } from "@/lib/brand"
import {
  Archive,
  BarChart2,
  Bot,
  Building2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  Loader,
  Send,
  Settings,
  Sparkle,
  UserCog,
  Users,
  BookOpen,
} from "lucide-react"

// ─── Module guide data ────────────────────────────────────────────────────────

interface ModuleCard {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}

const MODULES: ModuleCard[] = [
  {
    icon: <LayoutDashboard size={20} />,
    title: "Dashboard General",
    description:
      "Visualiza estadísticas en tiempo real, proyecciones estadísticas y el resumen ejecutivo generado por IA para la elección activa.",
    href: "/admin/dashboard",
  },
  {
    icon: <Landmark size={20} />,
    title: "Elecciones",
    description:
      "Crea y administra procesos electorales. Define detalles, asociaciones, candidatos, padrón de votantes y supervisa el estado.",
    href: "/admin/elecciones/detalles",
  },
  {
    icon: <Users size={20} />,
    title: "Asociaciones y Candidatos",
    description:
      "Registra planillas con sus candidatos, cargos y fotografías. Vincula cada planilla a la carrera correspondiente.",
    href: "/admin/elecciones/asociaciones",
  },
  {
    icon: <UserCog size={20} />,
    title: "Gestión de Usuarios",
    description:
      "Administra cuentas de administradores y observadores. Crea, edita y desactiva accesos al sistema.",
    href: "/admin/configuracion/usuarios",
  },
  {
    icon: <GraduationCap size={20} />,
    title: "Banco de Carreras",
    description:
      "Mantén el catálogo de carreras universitarias. Cada carrera define el mínimo de votos requeridos para validar resultados.",
    href: "/admin/configuracion/carreras",
  },
  {
    icon: <Building2 size={20} />,
    title: "Banco de Campus",
    description:
      "Gestiona las sedes o campus de UNITEC que participan en los procesos electorales.",
    href: "/admin/configuracion/campus",
  },
  {
    icon: <BarChart2 size={20} />,
    title: "Resultados",
    description:
      "Consulta los resultados en tiempo real por elección, con métricas de participación y desglose por planilla.",
    href: "/admin/elecciones/resultados",
  },
  {
    icon: <Archive size={20} />,
    title: "Archivados",
    description:
      "Accede a las elecciones finalizadas o canceladas. Puedes ver sus resultados históricos o restaurarlas como borrador.",
    href: "/admin/archivados",
  },
  {
    icon: <Settings size={20} />,
    title: "Mi Perfil",
    description:
      "Actualiza tu información personal y contraseña de acceso al panel administrativo.",
    href: "/admin/configuracion/perfil",
  },
]

// ─── FAQ data ─────────────────────────────────────────────────────────────────

interface FaqItem {
  question: string
  answer: string
}

const FAQ: FaqItem[] = [
  {
    question: "¿Cómo creo una nueva elección?",
    answer:
      'Dirígete a "Elecciones → Detalles Generales" y haz clic en "Nueva Elección". El asistente de creación (wizard) te guiará paso a paso: primero defines los datos generales (nombre, campus, fechas), luego añades asociaciones y candidatos, importas el padrón de votantes y finalmente revisas todo antes de activarla.',
  },
  {
    question: "¿Cuáles son los estados posibles de una elección?",
    answer:
      "Una elección pasa por cinco estados: Borrador (en construcción), Programada (configurada, aún no ha empezado), Activa (en curso, los votantes pueden emitir su voto), Finalizada (el período de votación cerró) y Archivada (desactivada o cancelada). Las transiciones se controlan desde la sección Revisión.",
  },
  {
    question: "¿Cómo importo el padrón de votantes?",
    answer:
      'En el paso "Votantes" del wizard de creación, puedes cargar un archivo CSV con las columnas: institutional_id, full_name, email y career_id. El sistema realiza una importación masiva (upsert) y reporta los registros creados, omitidos y errores por fila.',
  },
  {
    question: "¿Qué es la proyección estadística?",
    answer:
      "La proyección usa un intervalo de confianza del 95% con corrección de población finita (FPC) para estimar el resultado probable mientras la elección está activa. También detecta anomalías estadísticas mediante z-score. Aparece en el Dashboard General cuando hay suficientes votos para que el margen de error sea significativo.",
  },
  {
    question: "¿Cómo activo una elección para que los estudiantes puedan votar?",
    answer:
      'Desde "Elecciones → Revisión", una vez que hayas completado todos los pasos del wizard, verás el botón "Activar". Esto cambia el estado de "Programada" a "Activa" y habilita el acceso al portal de votación para los estudiantes registrados en el padrón.',
  },
  {
    question: "¿Los votos son secretos?",
    answer:
      "Sí. Cada papeleta se almacena con un hash SHA-256 que garantiza integridad sin vincular el voto al votante. El sistema registra que el estudiante votó, pero no a qué planilla votó.",
  },
  {
    question: "¿Qué hace el Asistente IA?",
    answer:
      "El asistente usa un modelo de lenguaje (Gemini 2.0 Flash o Groq Llama-3.3) con instrucciones específicas del sistema. En el panel admin puede responder preguntas sobre gestión de elecciones, interpretar resultados y generar resúmenes ejecutivos. También está disponible para los estudiantes durante el proceso de votación.",
  },
  {
    question: "¿Cómo archivar una elección que ya terminó?",
    answer:
      'Desde "Elecciones → Detalles Generales", en el menú de acciones de cada card, haz clic en el ícono de archivo. Esto transiciona la elección al estado "Archivada" y la mueve a la sección Archivados, donde permanece disponible para consultar resultados históricos.',
  },
  {
    question: "¿Puedo restaurar una elección archivada?",
    answer:
      'Sí. Ve a "Archivados", encuentra la elección y haz clic en "Restaurar". Esto la devuelve al estado "Borrador" para que puedas editarla y volver a activarla si es necesario.',
  },
  {
    question: "¿Cómo añado un nuevo administrador?",
    answer:
      'Ve a "Configuración → Gestión de Usuarios" y haz clic en "Nuevo Usuario". Ingresa nombre completo, correo institucional y asigna el rol (admin u observador). El usuario recibirá acceso mediante el flujo de autenticación OTP con su correo registrado.',
  },
]

// ─── Inline chat ──────────────────────────────────────────────────────────────

type ChatEntry = ChatMessage & { id: string }

const WELCOME: ChatEntry = {
  id: "welcome",
  role: "assistant",
  content:
    "¡Hola! Soy el asistente administrativo de UNITEC. Puedo ayudarte con cualquier duda sobre el sistema: cómo crear elecciones, gestionar votantes, interpretar resultados y más. ¿En qué te puedo ayudar?",
}

const SUGGESTIONS = [
  "¿Cómo crear una elección?",
  "¿Cómo importar votantes?",
  "¿Cómo activar una elección?",
  "¿Qué estados tiene una elección?",
]

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}

function InlineChat({ token }: { token: string }) {
  const [messages, setMessages] = useState<ChatEntry[]>([WELCOME])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" })
  }, [messages.length, sending])

  async function send(content: string) {
    const trimmed = content.trim()
    if (!trimmed || sending) return
    setError(null)
    const next: ChatEntry[] = [
      ...messages,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]
    setMessages(next)
    setInput("")
    setSending(true)
    try {
      const history: ChatMessage[] = next
        .filter((m) => m.id !== "welcome")
        .map(({ role, content: c }) => ({ role, content: c }))
      const reply = await sendChatMessage(history, token)
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ])
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "No pude conectar con el asistente. Intenta de nuevo."
      setError(msg)
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Tuve un problema procesando tu pregunta. Intenta de nuevo en un momento.",
        },
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
    <div className="flex h-[480px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-[#F6F8FC] shadow-sm">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 text-white"
        style={{ backgroundColor: BRAND }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
          <Bot size={16} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Asistente UNITEC</p>
          <p className="flex items-center gap-1 text-[11px] text-white/70">
            <Sparkle size={10} />
            IA · Panel administrativo
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
          const isUser = m.role === "user"
          return (
            <div key={m.id} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? "rounded-br-md text-white"
                    : "rounded-bl-md bg-white text-gray-800 ring-1 ring-gray-200"
                }`}
                style={isUser ? { backgroundColor: BRAND } : undefined}
              >
                {m.content.split("\n").map((line, i) => (
                  <p key={i} className={i === 0 ? "" : "mt-1"}>
                    {renderInline(line)}
                  </p>
                ))}
              </div>
            </div>
          )
        })}

        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-sm text-gray-500 shadow-sm ring-1 ring-gray-200">
              <Loader size={14} className="animate-spin" />
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
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-gray-200 transition"
                  style={{ color: BRAND }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = BRAND
                    e.currentTarget.style.color = "#ffffff"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = BRAND
                  }}
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

      {/* Input */}
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
          <Send size={15} />
        </button>
      </form>
    </div>
  )
}

// ─── FAQ accordion ────────────────────────────────────────────────────────────

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm">
      {FAQ.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-gray-800 transition hover:bg-gray-50"
          >
            <span>{item.question}</span>
            {open === i ? (
              <ChevronUp size={16} className="flex-shrink-0 text-gray-400" />
            ) : (
              <ChevronDown size={16} className="flex-shrink-0 text-gray-400" />
            )}
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-sm leading-relaxed text-gray-600">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminAyuda() {
  const { token } = useAuth()
  const navigate = useNavigate()

  return (
    <AdminLayout>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: BRAND }}>
          Centro de Ayuda
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Guía de uso del sistema, preguntas frecuentes y asistente IA para resolver tus dudas.
        </p>
      </div>

      {/* Módulos */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen size={18} style={{ color: BRAND }} />
          <h2 className="text-base font-semibold" style={{ color: BRAND }}>
            Guía de módulos
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => (
            <button
              key={mod.href}
              onClick={() => navigate(mod.href)}
              className="flex flex-col gap-3 rounded-2xl bg-white p-5 text-left shadow-sm transition hover:shadow-md"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "#EDF0F5", color: BRAND }}
              >
                {mod.icon}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: BRAND }}>
                  {mod.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{mod.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* FAQ + Chat en dos columnas */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* FAQ */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <HelpCircle size={18} style={{ color: BRAND }} />
            <h2 className="text-base font-semibold" style={{ color: BRAND }}>
              Preguntas frecuentes
            </h2>
          </div>
          <FaqAccordion />
        </section>

        {/* Inline chat */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Bot size={18} style={{ color: BRAND }} />
            <h2 className="text-base font-semibold" style={{ color: BRAND }}>
              Asistente IA
            </h2>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Consulta al asistente en lenguaje natural. Puede responder preguntas sobre el sistema,
            interpretar datos de elecciones y ayudarte con cualquier paso del proceso.
          </p>
          <InlineChat token={token!} />
        </section>
      </div>

      {/* Quick tips */}
      <section className="mt-10">
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6">
          <p className="mb-3 text-sm font-semibold" style={{ color: BRAND }}>
            Consejos rápidos
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: ACCENT }}
              >
                1
              </span>
              Antes de activar una elección, verifica en la sección{" "}
              <strong>Revisión</strong> que haya al menos una asociación con candidatos y votantes
              registrados.
            </li>
            <li className="flex items-start gap-2">
              <span
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: ACCENT }}
              >
                2
              </span>
              Usa la importación masiva de votantes (CSV) para elecciones con muchos participantes.
              El sistema detecta duplicados y los omite automáticamente.
            </li>
            <li className="flex items-start gap-2">
              <span
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: ACCENT }}
              >
                3
              </span>
              La proyección estadística en el Dashboard requiere un mínimo de votos para ser
              confiable. Hasta entonces, verás el mensaje "Datos insuficientes".
            </li>
            <li className="flex items-start gap-2">
              <span
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: ACCENT }}
              >
                4
              </span>
              El asistente IA también está disponible como botón flotante en la esquina inferior
              derecha desde cualquier pantalla del sistema.
            </li>
          </ul>
        </div>
      </section>
    </AdminLayout>
  )
}
