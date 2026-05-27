import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/contexts/AuthContext"
import Navbar from "@/components/Navbar"
import Home from "@/pages/Home"
import Clans from "@/pages/Clans"
import Dashboard from "@/pages/Dashboard"
import NotFound from "@/pages/NotFound"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/clans" element={<Clans />} />

              {/* Authenticated routes */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
