import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/contexts/AuthContext"
import AppLayout from "@/components/AppLayout"
import Home from "@/pages/Home"
import Clans from "@/pages/Clans"
import Dashboard from "@/pages/Dashboard"
import NotFound from "@/pages/NotFound"
import AdminPanel from "@/pages/AdminPanel"
import ModPanel from "@/pages/ModPanel"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/clans" element={<Clans />} />
            <Route path="/rankings" element={<Clans />} />
            <Route path="/competitions" element={<Clans />} />
            <Route path="/players" element={<Clans />} />

            {/* Authenticated routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/mod" element={<ModPanel />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  )
}
