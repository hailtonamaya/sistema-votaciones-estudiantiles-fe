import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import { getAdminUser, updateAdminUser } from "@/services/admin.service"
import { CheckCircle2, Loader2, Save, Shield } from "lucide-react"
import { ErrorBanner } from "@/components/ErrorBanner"

import { BRAND, ACCENT } from "@/lib/brand"

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  observer: "Observador",
  student: "Estudiante",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function AdminPerfil() {
  const { token, user, login } = useAuth()
  const [form, setForm] = useState({ full_name: user?.name ?? "", email: user?.email ?? "" })
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    getAdminUser(token!, user.id)
      .then((u) => {
        setForm({ full_name: u.full_name, email: u.email })
        setCreatedAt(u.created_at)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSave() {
    setError(null)
    setSuccess(false)
    if (!form.full_name.trim()) { setError("El nombre es requerido"); return }
    if (!form.email.trim()) { setError("El correo es requerido"); return }
    setSaving(true)
    try {
      const updated = await updateAdminUser(token!, user!.id, {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
      })
      login(token!, { id: user!.id, name: updated.full_name, email: updated.email, role: user!.role })
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar cambios")
    } finally {
      setSaving(false)
    }
  }

  const initials = (form.full_name || user?.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Mi Perfil</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Administra tu información personal y datos de cuenta.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="w-full space-y-6">
          {/* Profile header */}
          <div className="flex items-center gap-5 rounded-2xl bg-white p-6 shadow-sm">
            <div
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
              style={{ backgroundColor: ACCENT }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold" style={{ color: BRAND }}>
                {form.full_name || user?.name}
              </p>
              <p className="mt-0.5 truncate text-sm text-gray-500">
                {form.email || user?.email}
              </p>
              <div
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8" }}
              >
                <Shield size={11} />
                {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
              </div>
            </div>
          </div>

          {/* Personal info form */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-base font-bold" style={{ color: BRAND }}>
              Información Personal
            </h2>

            {error && <ErrorBanner message={error} />}

            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 size={16} className="flex-shrink-0" />
                Cambios guardados correctamente.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: BRAND }}>
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, full_name: e.target.value }))
                    setSuccess(false)
                  }}
                  placeholder="Nombre completo"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: BRAND }}>
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, email: e.target.value }))
                    setSuccess(false)
                  }}
                  placeholder="correo@unitec.edu.hn"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Cambiar el correo afecta el acceso al sistema mediante OTP.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: BRAND }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Guardar cambios
              </button>
            </div>
          </div>

          {/* Account details */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-base font-bold" style={{ color: BRAND }}>
              Detalles de Cuenta
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <span className="text-sm text-gray-500">Rol</span>
                <span className="text-sm font-semibold" style={{ color: BRAND }}>
                  {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <span className="text-sm text-gray-500">Estado</span>
                <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                  <CheckCircle2 size={11} />
                  Activo
                </div>
              </div>
              {createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Miembro desde</span>
                  <span className="text-sm text-gray-700">{formatDate(createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Security */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-base font-bold" style={{ color: BRAND }}>Seguridad</h2>
            <div className="flex items-start gap-3 rounded-xl bg-blue-50 px-4 py-4">
              <Shield size={18} className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: BRAND }}>
                  Autenticación por código de un solo uso (OTP)
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  El sistema utiliza OTP como método de autenticación seguro. No se requiere
                  contraseña. Los códigos se envían al correo electrónico registrado.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
