import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'

// Lazy loading das rotas secundárias para diminuir drasticamente o peso do carregamento inicial no mobile
const AuthPage = lazy(() => import('./pages/AuthPage'))
const PatientPortalPage = lazy(() => import('./pages/portal/PatientPortalPage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const TermsPrivacyPage = lazy(() => import('./pages/TermsPrivacyPage'))

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
      <div className="w-9 h-9 border-3 border-[#002B49] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global Scroll Restoration for All Route Changes */}
        <ScrollToTop />

        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Main Institutional Landing Page */}
            <Route path="/" element={<HomePage />} />

            {/* Dedicated Login Route */}
            <Route path="/login" element={<AuthPage initialMode="login" />} />

            {/* Dedicated Sign Up Route */}
            <Route path="/cadastro" element={<AuthPage initialMode="signup" />} />

            {/* Dedicated Password Reset Route */}
            <Route path="/redefinir-senha" element={<AuthPage initialMode="recovery" />} />

            {/* Módulos 2 e 3: Portal Unificado (Aluno / Paciente / Escola / Coordenação) */}
            <Route path="/dashboard" element={<PatientPortalPage />} />
            <Route path="/portal" element={<PatientPortalPage />} />
            <Route path="/portal/paciente" element={<PatientPortalPage />} />
            <Route path="/portal/escola" element={<PatientPortalPage />} />
            <Route path="/escola" element={<PatientPortalPage />} />

            {/* Rota Oculta Exclusiva para o Prof. Cesar Roberto Loureiro */}
            <Route path="/admin" element={<AdminDashboardPage />} />

            {/* Legal: Termos de Uso & Política de Privacidade */}
            <Route path="/termos" element={<TermsPrivacyPage />} />
            <Route path="/privacidade" element={<TermsPrivacyPage />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
