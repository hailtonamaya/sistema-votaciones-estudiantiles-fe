import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import { VotingProvider } from "@/context/VotingContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { ChatWidget } from "@/components/ChatWidget"

import LoginPage from "@/pages/LoginPage"
import OTPPage from "@/pages/OTPPage"

import AdminDashboard from "@/pages/admin/AdminDashboard"
import ObserverDashboard from "@/pages/observer/ObserverDashboard"

import StudentVotingPage from "@/pages/student/StudentVotingPage"
import StudentAssociationDetailPage from "@/pages/student/StudentAssociationDetailPage"
import StudentConfirmPage from "@/pages/student/StudentConfirmPage"
import StudentSuccessPage from "@/pages/student/StudentSuccessPage"

import AdminPlaceholder from "@/pages/admin/AdminPlaceholder"
import AdminEleccionesDetalles from "@/pages/admin/AdminEleccionesDetalles"
import AdminEleccionWizard from "@/pages/admin/AdminEleccionWizard"
import AdminEleccionAsociaciones from "@/pages/admin/AdminEleccionAsociaciones"
import AdminEleccionCandidatos from "@/pages/admin/AdminEleccionCandidatos"
import AdminEleccionVotantes from "@/pages/admin/AdminEleccionVotantes"
import AdminEleccionRevision from "@/pages/admin/AdminEleccionRevision"
import AdminGestionUsuarios from "@/pages/admin/AdminGestionUsuarios"
import AdminBancoCampus from "@/pages/admin/AdminBancoCampus"
import AdminBancoCarreras from "@/pages/admin/AdminBancoCarreras"
import AdminPerfil from "@/pages/admin/AdminPerfil"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VotingProvider>
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
                  <AdminPlaceholder title="Archivados" />
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
                  <AdminPlaceholder title="Resultados" />
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
                  <AdminPlaceholder title="Ayuda" />
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
          <ChatWidget />
        </VotingProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
