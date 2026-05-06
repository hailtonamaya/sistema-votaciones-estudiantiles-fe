import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { VotingProvider } from "@/context/VotingContext"
import StudentLoginPage from "@/pages/student/StudentLoginPage"
import StudentOTPPage from "@/pages/student/StudentOTPPage"
import StudentVotingPage from "@/pages/student/StudentVotingPage"
import StudentAssociationDetailPage from "@/pages/student/StudentAssociationDetailPage"
import StudentConfirmPage from "@/pages/student/StudentConfirmPage"
import StudentSuccessPage from "@/pages/student/StudentSuccessPage"

export default function App() {
  return (
    <BrowserRouter>
      <VotingProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/student/login" replace />} />
          <Route path="/student/login" element={<StudentLoginPage />} />
          <Route path="/student/verificar" element={<StudentOTPPage />} />
          <Route path="/student/votar" element={<StudentVotingPage />} />
          <Route path="/student/detalle" element={<StudentAssociationDetailPage />} />
          <Route path="/student/confirmar" element={<StudentConfirmPage />} />
          <Route path="/student/exito" element={<StudentSuccessPage />} />
        </Routes>
      </VotingProvider>
    </BrowserRouter>
  )
}
