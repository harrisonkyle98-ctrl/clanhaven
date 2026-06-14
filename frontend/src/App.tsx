import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/contexts/AuthContext"
import AppLayout from "@/components/AppLayout"
import Home from "@/pages/Home"
import Clans from "@/pages/Clans"
import Dashboard from "@/pages/Dashboard"
import NotFound from "@/pages/NotFound"
import AdminPanel from "@/pages/AdminPanel"
import ModPanel from "@/pages/ModPanel"
import SettingsPage from "@/pages/SettingsPage"
import ClanDiscovery from "@/pages/ClanDiscovery"
import ClanPage from "@/pages/ClanPage"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<Clans />} />
            <Route path="/faq" element={<Clans />} />
            <Route path="/features" element={<Clans />} />
            <Route path="/clans" element={<Clans />} />
            <Route path="/clan-directory" element={<ClanDiscovery />} />
            <Route path="/competitions" element={<Clans />} />
            <Route path="/clan-tools" element={<Clans />} />
            <Route path="/players" element={<Clans />} />

            {/* Authenticated routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/mod" element={<ModPanel />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Clan page — must be after all named routes */}
            <Route path="/:slug" element={<ClanPage />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  )
}
