import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { AuthProvider } from "@/context/AuthContext"
import { VotingProvider } from "@/context/VotingContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { ChatWidget } from "@/components/ChatWidget"
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary"

// Rutas públicas — carga inmediata (login path crítico)
import LoginPage from "@/pages/LoginPage"
import OTPPage from "@/pages/OTPPage"

// Rutas lazy — se cargan solo cuando el usuario navega a ellas
const AdminDashboard          = lazy(() => import("@/pages/admin/AdminDashboard"))
const AdminPlaceholder        = lazy(() => import("@/pages/admin/AdminPlaceholder"))
const AdminResultados         = lazy(() => import("@/pages/admin/AdminResultados"))
const AdminEleccionesDetalles = lazy(() => import("@/pages/admin/AdminEleccionesDetalles"))
const AdminEleccionWizard     = lazy(() => import("@/pages/admin/AdminEleccionWizard"))
const AdminEleccionEditar     = lazy(() => import("@/pages/admin/AdminEleccionEditar"))
const AdminEleccionAsociaciones = lazy(() => import("@/pages/admin/AdminEleccionAsociaciones"))
const AdminEleccionCandidatos = lazy(() => import("@/pages/admin/AdminEleccionCandidatos"))
const AdminEleccionVotantes   = lazy(() => import("@/pages/admin/AdminEleccionVotantes"))
const AdminEleccionRevision   = lazy(() => import("@/pages/admin/AdminEleccionRevision"))
const AdminGestionUsuarios    = lazy(() => import("@/pages/admin/AdminGestionUsuarios"))
const AdminBancoCampus        = lazy(() => import("@/pages/admin/AdminBancoCampus"))
const AdminBancoCarreras      = lazy(() => import("@/pages/admin/AdminBancoCarreras"))
const AdminPerfil             = lazy(() => import("@/pages/admin/AdminPerfil"))
const AdminArchivados         = lazy(() => import("@/pages/admin/AdminArchivados"))
const AdminAyuda              = lazy(() => import("@/pages/admin/AdminAyuda"))

const ObserverDashboard           = lazy(() => import("@/pages/observer/ObserverDashboard"))

const StudentVotingPage           = lazy(() => import("@/pages/student/StudentVotingPage"))
const StudentAssociationDetailPage = lazy(() => import("@/pages/student/StudentAssociationDetailPage"))
const StudentConfirmPage          = lazy(() => import("@/pages/student/StudentConfirmPage"))
const StudentSuccessPage          = lazy(() => import("@/pages/student/StudentSuccessPage"))

function PageLoader() {
  return (
    <div className="flex h-dvh items-center justify-center bg-bg-light">
      <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VotingProvider>
          <ChunkErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />

              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/otp" element={<OTPPage />} />

              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/archivados"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminArchivados />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/elecciones/detalles"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminEleccionesDetalles />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/elecciones/wizard"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminEleccionWizard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/elecciones/editar"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminEleccionEditar />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/elecciones/asociaciones"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminEleccionAsociaciones />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/elecciones/candidatos"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminEleccionCandidatos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/elecciones/votantes"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminEleccionVotantes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/elecciones/revision"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminEleccionRevision />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/elecciones/resultados"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminResultados />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/configuracion/usuarios"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminGestionUsuarios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/configuracion/campus"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminBancoCampus />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/configuracion/carreras"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminBancoCarreras />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/configuracion/perfil"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminPerfil />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/configuracion/parametros"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminPlaceholder title="Parámetros Globales" />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/ayuda"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminAyuda />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/observer/dashboard"
                element={
                  <ProtectedRoute roles={["observer"]}>
                    <ObserverDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/student/votar"
                element={
                  <ProtectedRoute roles={["student"]}>
                    <StudentVotingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/detalle"
                element={
                  <ProtectedRoute roles={["student"]}>
                    <StudentAssociationDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/confirmar"
                element={
                  <ProtectedRoute roles={["student"]}>
                    <StudentConfirmPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/exito"
                element={
                  <ProtectedRoute roles={["student"]}>
                    <StudentSuccessPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
          </ChunkErrorBoundary>
          <ChatWidget />
        </VotingProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
