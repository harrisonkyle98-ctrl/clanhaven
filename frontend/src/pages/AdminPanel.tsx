import { useEffect, useRef, useState } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { apiFetch } from "@/lib/api"
import CollapsiblePanel from "@/components/CollapsiblePanel"
import RichTextEditor from "@/components/RichTextEditor"


const TABS = [
  { id: "home", label: "Home" },
  { id: "news", label: "News" },
  { id: "users", label: "Users" },
] as const

const FUTURE_TABS = [
  { label: "Clans" },
  { label: "Site Settings" },
  { label: "Content" },
]

type TabId = (typeof TABS)[number]["id"]

export default function AdminPanel() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>("home")

  if (loading) {
    return (
      <div className="ch-page-content p-6">
        <p style={{ color: "rgba(200,180,150,0.6)" }}>Loading…</p>
      </div>
    )
  }

  if (!user || user.privileges < 2) {
    return <Navigate to="/" replace />
  }

  return (
    <div>
      <div className="ch-page-banner">
        <img
          src="/images/home-banner.jpg"
          alt="Admin banner"
          className="ch-page-banner-img"
        />
        <div className="ch-page-banner-content">
          <h1 className="ch-page-banner-title">
            Admin Panel
          </h1>
        </div>
      </div>

      <div className="ch-page-content p-4 lg:p-6 space-y-4">
        {/* Tab navigation */}
        <div className="ch-admin-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`ch-admin-tab${activeTab === tab.id ? " ch-admin-tab--active" : ""}`}
              onClick={() => { setActiveTab(tab.id) }}
            >
              <span>{tab.label}</span>
            </button>
          ))}
          {FUTURE_TABS.map((tab) => (
            <button
              key={tab.label}
              className="ch-admin-tab ch-admin-tab--disabled"
              disabled
              title="Coming soon"
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "home" && <AdminHomeTab username={user.rsn ?? user.username} />}
        {activeTab === "news" && <AdminNewsTab />}
        {activeTab === "users" && <AdminUsersTab />}
      </div>
    </div>
  )
}

function AdminHomeTab({ username }: { username: string }) {
  return (
    <div className="space-y-4">
      <CollapsiblePanel variant="purple" title="Admin Overview">
        <div className="ch-admin-overview">
          <p className="ch-admin-welcome">
            Welcome back, <span className="ch-admin-highlight">{username}</span>
          </p>
          <p className="ch-admin-description">
            This is the Clan Haven administration panel. From here you can manage
            site content, users, clans, and settings.
          </p>
        </div>
      </CollapsiblePanel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CollapsiblePanel variant="purple" title="Site Status">
          <div className="ch-admin-section">
            <div className="ch-admin-status-row">
              <span className="ch-admin-status-label">Your Role</span>
              <span className="ch-admin-status-value ch-admin-highlight">Site Administrator</span>
            </div>
            <div className="ch-admin-status-row">
              <span className="ch-admin-status-label">Auth System</span>
              <span className="ch-admin-status-value">Discord OAuth</span>
            </div>
            <div className="ch-admin-status-row">
              <span className="ch-admin-status-label">Identity System</span>
              <span className="ch-admin-status-value">RuneScape Hiscores</span>
            </div>
            <div className="ch-admin-status-row">
              <span className="ch-admin-status-label">Clan Indexing</span>
              <span className="ch-admin-status-value">Active (RS3)</span>
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel variant="purple" title="Quick Actions">
          <div className="ch-admin-section">
            <p className="ch-admin-placeholder">
              Homepage content management, news publishing, and site configuration
              controls will be available here in future updates.
            </p>
          </div>
        </CollapsiblePanel>
      </div>

      <CollapsiblePanel variant="purple" title="Management Modules">
        <div className="ch-admin-section">
          <div className="ch-admin-modules-grid">
            {[
              { title: "News Management", desc: "Create and manage Clan Haven news articles" },
              { title: "User Management", desc: "View and manage registered users" },
              { title: "Clan Management", desc: "Manage indexed clans and membership data" },
              { title: "Site Settings", desc: "Configure site-wide settings and preferences" },
              { title: "Content Editor", desc: "Edit homepage content and featured sections" },
              { title: "Audit Log", desc: "View administrative action history" },
            ].map((mod) => (
              <div key={mod.title} className="ch-admin-module-card">
                <h4 className="ch-admin-module-title">{mod.title}</h4>
                <p className="ch-admin-module-desc">{mod.desc}</p>
                <span className="ch-admin-module-badge">Coming Soon</span>
              </div>
            ))}
          </div>
        </div>
      </CollapsiblePanel>
    </div>
  )
}


// ─── News Tab ───

const NEWS_CATEGORIES = ["News", "Update", "Maintenance", "Event", "Competition"] as const

interface NewsPost {
  id: string
  title: string
  content: string
  excerpt: string | null
  category: string
  bannerUrl: string | null
  thumbnailUrl: string | null
  published: boolean
  authorId: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

interface SliderSlot {
  id: string
  slotNumber: number
  imageUrl: string
  title: string
  description: string
  meta: string
  cta: string
  ctaLink: string
  imageGradient: string
  active: boolean
  createdAt: string
  updatedAt: string
}

interface HighlightSlot {
  id: string
  slotNumber: number
  imageUrl: string
  imagePosition: string
  title: string
  description: string
  buttonText: string
  buttonLink: string
  active: boolean
  createdAt: string
  updatedAt: string
}

const slotFieldStyle: React.CSSProperties = {
  background: "rgba(0, 0, 0, 0.3)",
  border: "1px solid rgba(120, 100, 60, 0.2)",
  color: "rgba(200, 180, 140, 0.9)",
  padding: "0.25rem 0.5rem",
  fontSize: "0.6875rem",
  width: "100%",
  outline: "none",
}

const slotLabelStyle: React.CSSProperties = {
  fontSize: "0.625rem",
  color: "rgba(200, 180, 140, 0.6)",
  marginBottom: "0.125rem",
}

function SliderImageManager() {
  const [slots, setSlots] = useState<SliderSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlot, setEditingSlot] = useState<number | null>(null)
  const [editFields, setEditFields] = useState<Partial<SliderSlot>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    apiFetch<SliderSlot[]>("/api/admin/slider-images")
      .then(setSlots)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const formatSlotDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const openEditor = (slot: SliderSlot) => {
    setEditingSlot(slot.slotNumber)
    setEditFields({
      title: slot.title,
      description: slot.description,
      meta: slot.meta,
      cta: slot.cta,
      ctaLink: slot.ctaLink,
      imageGradient: slot.imageGradient,
    })
  }

  const closeEditor = () => {
    setEditingSlot(null)
    setEditFields({})
  }

  const saveSlot = async () => {
    if (editingSlot === null) return
    setSaving(true)
    try {
      await apiFetch(`/api/admin/slider-images/${editingSlot}`, {
        method: "PUT",
        body: JSON.stringify(editFields),
      })
      load()
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (slotNumber: number, currentActive: boolean) => {
    await apiFetch(`/api/admin/slider-images/${slotNumber}`, {
      method: "PUT",
      body: JSON.stringify({ active: !currentActive }),
    })
    load()
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingSlot === null) return
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const token = localStorage.getItem("access_token")
      const resp = await fetch(`/api/admin/slider-images/${editingSlot}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!resp.ok) throw new Error("Upload failed")
      load()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const removeImage = async (slotNumber: number) => {
    await apiFetch(`/api/admin/slider-images/${slotNumber}/image`, { method: "DELETE" })
    load()
  }

  const currentSlot = slots.find((s) => s.slotNumber === editingSlot)

  return (
    <CollapsiblePanel variant="purple" title="Slider Management">
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[10px] text-text-muted">
          Manage the 4 homepage slider slots. Each slide has a 60/40 layout: left panel shows the image (or gradient), right panel shows text content. Inactive slides are skipped on the homepage.
        </p>

        {loading ? (
          <p className="text-xs text-text-muted">Loading slider slots…</p>
        ) : editingSlot !== null && currentSlot ? (
          /* ── Slot Editor View ── */
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                className="ch-sidebar-account-action"
                style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                onClick={closeEditor}
              >
                Back
              </button>
              <span className="text-xs text-text-primary" style={{ fontWeight: 600 }}>Editing Slide {editingSlot}</span>
            </div>

            {/* Image preview */}
            <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(120,100,60,0.15)", padding: "0.75rem" }}>
              <div style={slotLabelStyle}>Slide image</div>
              {currentSlot.imageUrl ? (
                <div className="flex items-end gap-3">
                  <img
                    src={currentSlot.imageUrl}
                    alt={`Slide ${editingSlot}`}
                    style={{ maxWidth: "300px", height: "52px", objectFit: "cover" }}
                  />
                  <div className="flex gap-1.5">
                    <button
                      className="ch-sidebar-account-action"
                      style={{ width: "auto", padding: "0.125rem 0.5rem", fontSize: "0.625rem" }}
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading…" : "Replace Image"}
                    </button>
                    <button
                      className="ch-sidebar-account-action"
                      style={{ width: "auto", padding: "0.125rem 0.5rem", fontSize: "0.625rem" }}
                      onClick={() => { void removeImage(editingSlot) }}
                    >
                      Remove Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div style={{ width: "120px", height: "52px", background: currentSlot.imageGradient || "linear-gradient(135deg, #1a1a2e, #16213e)" }} />
                  <div>
                    <button
                      className="ch-sidebar-account-action"
                      style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading…" : "Upload Image"}
                    </button>
                    <p className="text-[10px] text-text-muted" style={{ marginTop: "0.25rem" }}>No image — gradient will be used. Recommended: 1750 × 300 px</p>
                  </div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => { void handleUpload(e) }}
                style={{ display: "none" }}
              />
            </div>

            {/* Editable fields */}
            <div>
              <div style={slotLabelStyle}>Title</div>
              <input
                type="text"
                value={editFields.title ?? ""}
                onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                placeholder="Slide title"
                style={slotFieldStyle}
              />
            </div>
            <div>
              <div style={slotLabelStyle}>Description</div>
              <textarea
                value={editFields.description ?? ""}
                onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
                placeholder="Slide description text"
                rows={2}
                style={{ ...slotFieldStyle, resize: "vertical" }}
              />
            </div>
            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <div style={slotLabelStyle}>Meta text</div>
                <input
                  type="text"
                  value={editFields.meta ?? ""}
                  onChange={(e) => setEditFields({ ...editFields, meta: e.target.value })}
                  placeholder='e.g. "Latest Update"'
                  style={slotFieldStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={slotLabelStyle}>CTA button text</div>
                <input
                  type="text"
                  value={editFields.cta ?? ""}
                  onChange={(e) => setEditFields({ ...editFields, cta: e.target.value })}
                  placeholder='e.g. "Learn More"'
                  style={slotFieldStyle}
                />
              </div>
            </div>
            <div>
              <div style={slotLabelStyle}>CTA button link (URL)</div>
              <input
                type="text"
                value={editFields.ctaLink ?? ""}
                onChange={(e) => setEditFields({ ...editFields, ctaLink: e.target.value })}
                placeholder='e.g. "/clans" or "https://example.com"'
                style={slotFieldStyle}
              />
            </div>
            <div>
              <div style={slotLabelStyle}>Image gradient (CSS, used when no image is uploaded)</div>
              <input
                type="text"
                value={editFields.imageGradient ?? ""}
                onChange={(e) => setEditFields({ ...editFields, imageGradient: e.target.value })}
                placeholder="e.g. linear-gradient(135deg, #1a1a2e, #16213e)"
                style={slotFieldStyle}
              />
            </div>

            <div className="flex justify-end gap-2" style={{ marginTop: "0.25rem" }}>
              <button
                className="ch-sidebar-account-action"
                style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                onClick={() => { void saveSlot() }}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          /* ── Slot Grid View ── */
          <div className="flex flex-col gap-2">
            {slots.map((slot) => (
              <div key={slot.id} className="ch-row px-4 py-3 group cursor-pointer" onClick={() => openEditor(slot)}>
                <div className="flex items-center gap-3">
                  {slot.imageUrl ? (
                    <img
                      src={slot.imageUrl}
                      alt={`Slide ${slot.slotNumber}`}
                      className="ch-news-upload-preview"
                      style={{ flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      className="ch-news-upload-preview"
                      style={{
                        flexShrink: 0,
                        background: "rgba(30,30,30,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "0.5rem", color: "rgba(200,180,140,0.4)" }}>No image</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-highlight group-hover:text-gold transition-colors">
                      Slide {slot.slotNumber}{slot.title ? ` — ${slot.title}` : ""}
                    </span>
                    {slot.active ? (
                      <span className="badge-online">Active</span>
                    ) : (
                      <span className="badge-offline">Inactive</span>
                    )}
                  </div>
                </div>
                <div className="ch-user-row-details">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {slot.imageUrl ? (
                      <span className="badge-info">Image uploaded</span>
                    ) : (
                      <span className="badge-info">No image</span>
                    )}
                    <span className="badge-info">Edited {formatSlotDate(slot.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="ch-sidebar-account-action"
                    style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                    onClick={() => openEditor(slot)}
                  >
                    Edit
                  </button>
                  <button
                    className="ch-sidebar-account-action"
                    style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                    onClick={() => { void toggleActive(slot.slotNumber, slot.active) }}
                  >
                    {slot.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsiblePanel>
  )
}

function HighlightManager() {
  const [slots, setSlots] = useState<HighlightSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlot, setEditingSlot] = useState<number | null>(null)
  const [editFields, setEditFields] = useState<Partial<HighlightSlot>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const hlFileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    apiFetch<HighlightSlot[]>("/api/admin/highlights")
      .then(setSlots)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const openEditor = (slot: HighlightSlot) => {
    setEditingSlot(slot.slotNumber)
    setEditFields({
      title: slot.title,
      description: slot.description,
      buttonText: slot.buttonText,
      buttonLink: slot.buttonLink,
      imagePosition: slot.imagePosition,
    })
  }

  const closeEditor = () => {
    setEditingSlot(null)
    setEditFields({})
  }

  const saveSlot = async () => {
    if (editingSlot === null) return
    setSaving(true)
    try {
      await apiFetch(`/api/admin/highlights/${editingSlot}`, {
        method: "PUT",
        body: JSON.stringify(editFields),
      })
      load()
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (slotNumber: number, currentActive: boolean) => {
    await apiFetch(`/api/admin/highlights/${slotNumber}`, {
      method: "PUT",
      body: JSON.stringify({ active: !currentActive }),
    })
    load()
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingSlot === null) return
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const token = localStorage.getItem("access_token")
      const resp = await fetch(`/api/admin/highlights/${editingSlot}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!resp.ok) throw new Error("Upload failed")
      load()
    } finally {
      setUploading(false)
      if (hlFileRef.current) hlFileRef.current.value = ""
    }
  }

  const removeImage = async (slotNumber: number) => {
    await apiFetch(`/api/admin/highlights/${slotNumber}/image`, { method: "DELETE" })
    load()
  }

  const currentSlot = slots.find((s) => s.slotNumber === editingSlot)

  return (
    <CollapsiblePanel variant="purple" title="Highlight Management">
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[10px] text-text-muted">
          Manage the 4 homepage highlight cards. Inactive highlights are skipped on the homepage; fallback cards are used when no active highlights exist.
        </p>

        {loading ? (
          <p className="text-xs text-text-muted">Loading highlight slots…</p>
        ) : editingSlot !== null && currentSlot ? (
          /* ── Highlight Editor View ── */
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                className="ch-sidebar-account-action"
                style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                onClick={closeEditor}
              >
                Back
              </button>
              <span className="text-xs text-text-primary" style={{ fontWeight: 600 }}>Editing Highlight {editingSlot}</span>
            </div>

            {/* Image preview */}
            <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(120,100,60,0.15)", padding: "0.75rem" }}>
              <div style={slotLabelStyle}>Highlight image</div>
              {currentSlot.imageUrl ? (
                <div className="flex items-end gap-3">
                  <img
                    src={currentSlot.imageUrl}
                    alt={`Highlight ${editingSlot}`}
                    style={{ maxWidth: "120px", height: "80px", objectFit: "cover" }}
                  />
                  <div className="flex gap-1.5">
                    <button
                      className="ch-sidebar-account-action"
                      style={{ width: "auto", padding: "0.125rem 0.5rem", fontSize: "0.625rem" }}
                      onClick={() => hlFileRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading…" : "Replace Image"}
                    </button>
                    <button
                      className="ch-sidebar-account-action"
                      style={{ width: "auto", padding: "0.125rem 0.5rem", fontSize: "0.625rem" }}
                      onClick={() => { void removeImage(editingSlot) }}
                    >
                      Remove Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div style={{ width: "120px", height: "80px", background: "rgba(30,30,30,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "0.5rem", color: "rgba(200,180,140,0.4)" }}>No image</span>
                  </div>
                  <div>
                    <button
                      className="ch-sidebar-account-action"
                      style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                      onClick={() => hlFileRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading…" : "Upload Image"}
                    </button>
                  </div>
                </div>
              )}
              <input
                ref={hlFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => { void handleUpload(e) }}
                style={{ display: "none" }}
              />
            </div>

            {/* Editable fields */}
            <div>
              <div style={slotLabelStyle}>Title</div>
              <input
                type="text"
                value={editFields.title ?? ""}
                onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                placeholder="Highlight title"
                style={slotFieldStyle}
              />
            </div>
            <div>
              <div style={slotLabelStyle}>Description</div>
              <textarea
                value={editFields.description ?? ""}
                onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
                placeholder="Highlight description text"
                rows={2}
                style={{ ...slotFieldStyle, resize: "vertical" }}
              />
            </div>
            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <div style={slotLabelStyle}>Button text</div>
                <input
                  type="text"
                  value={editFields.buttonText ?? ""}
                  onChange={(e) => setEditFields({ ...editFields, buttonText: e.target.value })}
                  placeholder='e.g. "Explore"'
                  style={slotFieldStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={slotLabelStyle}>Button link (URL)</div>
                <input
                  type="text"
                  value={editFields.buttonLink ?? ""}
                  onChange={(e) => setEditFields({ ...editFields, buttonLink: e.target.value })}
                  placeholder='e.g. "/clans" or "https://..."'
                  style={slotFieldStyle}
                />
              </div>
            </div>
            <div>
              <div style={slotLabelStyle}>Image position (CSS object-position)</div>
              <input
                type="text"
                value={editFields.imagePosition ?? "center"}
                onChange={(e) => setEditFields({ ...editFields, imagePosition: e.target.value })}
                placeholder='e.g. "center", "center bottom", "top"'
                style={slotFieldStyle}
              />
            </div>

            <div className="flex justify-end gap-2" style={{ marginTop: "0.25rem" }}>
              <button
                className="ch-sidebar-account-action"
                style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                onClick={() => { void saveSlot() }}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          /* ── Highlight Grid View ── */
          <div className="flex flex-col gap-2">
            {slots.map((slot) => (
              <div key={slot.id} className="ch-row px-4 py-3 group cursor-pointer" onClick={() => openEditor(slot)}>
                <div className="flex items-center gap-3">
                  {slot.imageUrl ? (
                    <img
                      src={slot.imageUrl}
                      alt={`Highlight ${slot.slotNumber}`}
                      className="ch-news-upload-preview"
                      style={{ flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      className="ch-news-upload-preview"
                      style={{
                        flexShrink: 0,
                        background: "rgba(30,30,30,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "0.5rem", color: "rgba(200,180,140,0.4)" }}>No image</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-highlight group-hover:text-gold transition-colors">
                      Highlight {slot.slotNumber}{slot.title ? ` — ${slot.title}` : ""}
                    </span>
                    {slot.active ? (
                      <span className="badge-online">Active</span>
                    ) : (
                      <span className="badge-offline">Inactive</span>
                    )}
                  </div>
                </div>
                <div className="ch-user-row-details">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {slot.imageUrl ? (
                      <span className="badge-info">Image uploaded</span>
                    ) : (
                      <span className="badge-info">No image</span>
                    )}
                    <span className="badge-info">Edited {formatDate(slot.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="ch-sidebar-account-action"
                    style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                    onClick={() => openEditor(slot)}
                  >
                    Edit
                  </button>
                  <button
                    className="ch-sidebar-account-action"
                    style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                    onClick={() => { void toggleActive(slot.slotNumber, slot.active) }}
                  >
                    {slot.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsiblePanel>
  )
}

function AdminNewsTab() {
  const [posts, setPosts] = useState<NewsPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<NewsPost | null>(null)
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState<NewsPost | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const loadPosts = () => {
    setLoading(true)
    apiFetch<NewsPost[]>("/api/admin/news")
      .then(setPosts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPosts() }, [])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/admin/news/${id}`, { method: "DELETE" })
    setConfirmDelete(null)
    loadPosts()
  }

  const handleTogglePublish = async (post: NewsPost) => {
    await apiFetch(`/api/admin/news/${post.id}`, {
      method: "PUT",
      body: JSON.stringify({ published: !post.published }),
    })
    loadPosts()
  }

  const isHtmlContent = (text: string) => /<[a-z][\s\S]*>/i.test(text)

  const openArticle = (post: NewsPost) => {
    setTransitioning(true)
    setTimeout(() => {
      setViewing(post)
      setTransitioning(false)
    }, 150)
  }

  const closeArticle = () => {
    setTransitioning(true)
    setTimeout(() => {
      setViewing(null)
      setTransitioning(false)
    }, 150)
  }

  if (editing) {
    return <NewsEditor post={editing} onDone={() => { setEditing(null); loadPosts() }} />
  }

  if (creating) {
    return <NewsEditor post={null} onDone={() => { setCreating(false); loadPosts() }} />
  }

  return (
    <div className="space-y-4">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SliderImageManager />
      <HighlightManager />
    </div>
    <CollapsiblePanel variant="purple" title="News Management">
      <div
        className="flex flex-col gap-2 flex-1"
        style={{ opacity: transitioning ? 0 : 1, transition: "opacity 150ms ease" }}
      >
        {viewing ? (
          <>
            <div className="px-4 pt-3 pb-1">
              <button className="ch-news-back" onClick={closeArticle}>
                ← Back to News
              </button>
            </div>
            {viewing.bannerUrl && (
              <div className="ch-news-banner">
                <img src={viewing.bannerUrl} alt="" className="ch-news-banner-img" />
              </div>
            )}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`badge-category badge-category--${(viewing.category || "Update").toLowerCase()}`}>
                  {viewing.category || "Update"}
                </span>
                {viewing.published ? (
                  <span className="badge-online">Published</span>
                ) : (
                  <span className="badge-offline">Draft</span>
                )}
                <span className="text-[10px] text-text-muted">
                  {viewing.publishedAt
                    ? formatDate(viewing.publishedAt)
                    : formatDate(viewing.createdAt)}
                </span>
              </div>
              <h3 className="ch-news-article-title">{viewing.title}</h3>
              {isHtmlContent(viewing.content) ? (
                <div
                  className="ch-news-article-body"
                  dangerouslySetInnerHTML={{ __html: viewing.content }}
                />
              ) : (
                <div className="ch-news-article-body">
                  {viewing.content.split("\n").map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
        <div className="px-4 py-2">
          <button
            className="ch-sidebar-account-action"
            style={{ width: "auto", padding: "0.4rem 1rem" }}
            onClick={() => setCreating(true)}
          >
            + New Post
          </button>
        </div>
        {loading && (
          <div className="ch-row px-4 py-3">
            <span className="text-sm text-text-muted">Loading news…</span>
          </div>
        )}
        {error && (
          <div className="ch-row px-4 py-3">
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}
        {!loading && !error && posts.length === 0 && (
          <div className="ch-row px-4 py-3">
            <span className="text-sm text-text-muted">No news posts yet. Create your first post above.</span>
          </div>
        )}
        {posts.map((p) => (
          <div key={p.id} className="ch-row px-4 py-3 group cursor-pointer" onClick={() => openArticle(p)}>
            <div className="flex items-center gap-3">
              {p.thumbnailUrl && (
                <img src={p.thumbnailUrl} alt="" className="ch-news-upload-preview" style={{ flexShrink: 0 }} />
              )}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-medium text-text-highlight group-hover:text-gold transition-colors">
                  {p.title}
                </span>
                <span className={`badge-category badge-category--${(p.category || "Update").toLowerCase()}`}>
                  {p.category || "Update"}
                </span>
                {p.published ? (
                  <span className="badge-online">Published</span>
                ) : (
                  <span className="badge-offline">Draft</span>
                )}
              </div>
            </div>
            <div className="ch-user-row-details">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="badge-info">Created {formatDate(p.createdAt)}</span>
                {p.publishedAt && (
                  <span className="badge-info">Published {formatDate(p.publishedAt)}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              <button
                className="ch-sidebar-account-action"
                style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                onClick={() => setEditing(p)}
              >
                Edit
              </button>
              <button
                className="ch-sidebar-account-action"
                style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                onClick={() => handleTogglePublish(p)}
              >
                {p.published ? "Unpublish" : "Publish"}
              </button>
              {confirmDelete === p.id ? (
                <>
                  <button
                    className="ch-sidebar-account-action"
                    style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem", color: "#f87171" }}
                    onClick={() => handleDelete(p.id)}
                  >
                    Confirm Delete
                  </button>
                  <button
                    className="ch-sidebar-account-action"
                    style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                    onClick={() => setConfirmDelete(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="ch-sidebar-account-action"
                  style={{ width: "auto", padding: "0.25rem 0.75rem", fontSize: "0.6875rem" }}
                  onClick={() => setConfirmDelete(p.id)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
          </>
        )}
      </div>
    </CollapsiblePanel>
    </div>
  )
}

function BannerUploadField({
  bannerUrl,
  onUpload,
  onRemove,
}: {
  bannerUrl: string | null
  onUpload: (banner: string, thumbnail: string) => void
  onRemove: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const token = localStorage.getItem("access_token")
      const resp = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!resp.ok) throw new Error("Upload failed")
      const data = await resp.json()
      onUpload(data.bannerUrl, data.thumbnailUrl)
    } catch {
      alert("Image upload failed. Max 5 MB, JPEG/PNG/WebP/GIF only.")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Article Image</label>
      <div className="ch-news-upload-area">
        {bannerUrl && <img src={bannerUrl} alt="" className="ch-news-upload-preview" />}
        <button
          type="button"
          className={`ch-news-upload-btn${uploading ? " uploading" : ""}`}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Uploading…" : bannerUrl ? "Change Image" : "Upload Image"}
        </button>
        {bannerUrl && (
          <button
            type="button"
            className="ch-news-upload-btn"
            onClick={onRemove}
          >
            Remove
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleUpload}
          style={{ display: "none" }}
        />
      </div>
      {bannerUrl && (
        <p className="text-[10px] text-text-muted mt-1">Thumbnail is auto-generated from a centered crop of this image.</p>
      )}
    </div>
  )
}

function NewsEditor({ post, onDone }: { post: NewsPost | null; onDone: () => void }) {
  const [title, setTitle] = useState(post?.title ?? "")
  const [content, setContent] = useState(post?.content ?? "")
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "")
  const [category, setCategory] = useState(post?.category ?? "Update")
  const [bannerUrl, setBannerUrl] = useState<string | null>(post?.bannerUrl ?? null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(post?.thumbnailUrl ?? null)
  const [published, setPublished] = useState(post?.published ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title,
        content,
        excerpt: excerpt || null,
        category,
        bannerUrl,
        thumbnailUrl,
        published,
      }
      if (post) {
        await apiFetch(`/api/admin/news/${post.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch("/api/admin/news", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }
      onDone()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <CollapsiblePanel variant="purple" title={post ? "Edit Post" : "New Post"}>
      <div className="flex flex-col gap-3 p-4">
        {error && <div className="text-sm text-red-400">{error}</div>}
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="ch-news-input"
            placeholder="Post title"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Excerpt (optional)</label>
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="ch-news-input"
            placeholder="Short summary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="ch-news-input"
          >
            {NEWS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <BannerUploadField
          bannerUrl={bannerUrl}
          onUpload={(banner, thumb) => { setBannerUrl(banner); setThumbnailUrl(thumb) }}
          onRemove={() => { setBannerUrl(null); setThumbnailUrl(null) }}
        />
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Content</label>
          <RichTextEditor content={content} onChange={setContent} />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="accent-purple-500"
            />
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Publish immediately</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="ch-sidebar-account-action"
            style={{ width: "auto", padding: "0.4rem 1.25rem" }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : post ? "Update Post" : "Create Post"}
          </button>
          <button
            className="ch-sidebar-account-action"
            style={{ width: "auto", padding: "0.4rem 1.25rem" }}
            onClick={onDone}
          >
            Cancel
          </button>
        </div>
      </div>
    </CollapsiblePanel>
  )
}


interface AdminUser {
  id: string
  discordId: string
  username: string
  avatar: string | null
  rsn: string | null
  gameType: string | null
  accountType: string | null
  rsnClanName: string | null
  rsnLinkedAt: string | null
  privileges: number
  lastOnline: string | null
  isBanned: boolean
  bannedAt: string | null
  banReason: string | null
  createdAt: string
  updatedAt: string
}

interface LoginEntry {
  id: string
  ipAddress: string
  userAgent: string
  createdAt: string
}

function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loginHistoryUser, setLoginHistoryUser] = useState<string | null>(null)
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([])
  const [loginLoading, setLoginLoading] = useState(false)

  const loadUsers = () => {
    apiFetch<AdminUser[]>("/api/admin/users")
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleViewLogins = async (userId: string) => {
    if (loginHistoryUser === userId) {
      setLoginHistoryUser(null)
      return
    }
    setLoginHistoryUser(userId)
    setLoginLoading(true)
    try {
      const data = await apiFetch<LoginEntry[]>(`/api/admin/users/${userId}/logins`)
      setLoginHistory(data)
    } catch {
      setLoginHistory([])
    } finally {
      setLoginLoading(false)
    }
  }

  const handleBan = async (userId: string) => {
    const reason = prompt("Ban reason (optional):")
    if (reason === null) return
    try {
      await apiFetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      loadUsers()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Ban failed")
    }
  }

  const handleUnban = async (userId: string) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/unban`, { method: "POST" })
      loadUsers()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Unban failed")
    }
  }

  const handleIpBan = async (userId: string) => {
    const reason = prompt("IP Ban reason (optional):")
    if (reason === null) return
    setLoginLoading(true)
    try {
      const logins = await apiFetch<LoginEntry[]>(`/api/admin/users/${userId}/logins`)
      if (logins.length === 0) {
        alert("No login history found for this user.")
        return
      }
      const ip = logins[0].ipAddress
      await apiFetch("/api/admin/ip-bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress: ip, reason }),
      })
      alert(`IP ${ip} has been banned.`)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "IP Ban failed")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleUnlink = async (userId: string, rsn: string | null) => {
    if (!confirm(`Unlink RSN "${rsn ?? "unknown"}" from this account? They will need to re-link.`)) return
    try {
      await apiFetch(`/api/admin/users/${userId}/unlink-rsn`, { method: "POST" })
      loadUsers()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Unlink failed")
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatRelativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return "Yesterday"
    if (days < 30) return `${days}d ago`
    return formatDate(iso)
  }

  const isOnline = (iso: string) => {
    return Date.now() - new Date(iso).getTime() < 5 * 60 * 1000
  }

  return (
    <CollapsiblePanel variant="purple" title="Registered Users">
      <div className="flex flex-col gap-2 flex-1">
        {loading && (
          <div className="ch-row px-4 py-3">
            <span className="text-sm text-text-muted">Loading users…</span>
          </div>
        )}
        {error && (
          <div className="ch-row px-4 py-3">
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}
        {!loading && !error && users.length === 0 && (
          <div className="ch-row px-4 py-3">
            <span className="text-sm text-text-muted">No registered users.</span>
          </div>
        )}
        {users.map((u) => (
          <div key={u.id} className="ch-row px-4 py-3 group">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-highlight group-hover:text-gold transition-colors" style={{ display: "inline-flex", alignItems: "center" }}>
                {u.rsn ?? u.username}
                {(u.accountType === "ironman" || u.accountType === "hardcore_ironman") && (
                  <img
                    src={u.accountType === "hardcore_ironman" ? "/images/sprites/hardcore.png" : "/images/sprites/ironman.png"}
                    alt={u.accountType === "hardcore_ironman" ? "Hardcore Ironman" : "Ironman"}
                    title={u.accountType === "hardcore_ironman" ? "Hardcore Ironman" : "Ironman"}
                    style={{ width: "12px", height: "12px", objectFit: "contain", marginLeft: "4px" }}
                  />
                )}
              </span>
              {u.lastOnline ? (
                <span className={isOnline(u.lastOnline) ? "badge-online" : "badge-offline"}>
                  {isOnline(u.lastOnline) ? "Online" : "Offline"}
                </span>
              ) : (
                <span className="badge-offline">Offline</span>
              )}
              {u.isBanned && (
                <span className="badge-banned">Banned</span>
              )}
              {/* Moderation controls — visible on hover only, hidden for admins */}
              <div className="ch-mod-actions">
                <button
                  onClick={() => { handleViewLogins(u.id) }}
                  className="ch-mod-action-btn"
                >
                  View Logins
                </button>
                {u.rsn && (
                  <button
                    onClick={() => { handleUnlink(u.id, u.rsn) }}
                    className="ch-mod-action-btn ch-mod-action-btn--danger"
                  >
                    Unlink
                  </button>
                )}
                {u.privileges < 2 && (
                  <>
                    {!u.isBanned ? (
                      <button
                        onClick={() => { handleBan(u.id) }}
                        className="ch-mod-action-btn ch-mod-action-btn--danger"
                      >
                        Ban Account
                      </button>
                    ) : (
                      <button
                        onClick={() => { handleUnban(u.id) }}
                        className="ch-mod-action-btn ch-mod-action-btn--success"
                      >
                        Unban
                      </button>
                    )}
                    <button
                      onClick={() => { handleIpBan(u.id) }}
                      className="ch-mod-action-btn ch-mod-action-btn--danger"
                    >
                      IP Ban
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="ch-user-row-details">
              <div className="flex items-center gap-1.5 flex-wrap">
                {u.rsn && (
                  <span className="badge-discord">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
                    </svg>
                    {u.username}
                  </span>
                )}
                {u.privileges >= 2 && (
                  <span className="badge-admin">Admin</span>
                )}
                {u.privileges === 1 && (
                  <span className="badge-mod">Mod</span>
                )}
                {u.rsnClanName && (
                  <span className="badge-clan">{u.rsnClanName}</span>
                )}

                {u.gameType && (
                  <span className={u.gameType === "RS3" ? "badge-rs3" : "badge-osrs"}>
                    {u.gameType}
                  </span>
                )}
                <span className="badge-info">Joined {formatDate(u.createdAt)}</span>
                {u.rsnLinkedAt && (
                  <span className="badge-info">RSN Linked {formatDate(u.rsnLinkedAt)}</span>
                )}
                {u.lastOnline && (
                  <span className="badge-info">Last Online {formatRelativeTime(u.lastOnline)}</span>
                )}
              </div>
            </div>
            {/* Login history panel */}
            {loginHistoryUser === u.id && (
              <div className="ch-user-row-details" style={{ marginTop: "0.5rem" }}>
                <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "#b0a088", marginBottom: "0.4rem" }}>Login History</div>
                {loginLoading ? (
                  <span style={{ fontSize: "0.6rem", color: "rgba(180,160,130,0.6)" }}>Loading…</span>
                ) : loginHistory.length === 0 ? (
                  <span style={{ fontSize: "0.6rem", color: "rgba(180,160,130,0.6)" }}>No login records.</span>
                ) : (
                  <div className="flex flex-col gap-1">
                    {loginHistory.slice(0, 10).map((l) => (
                      <div key={l.id} className="flex items-center gap-2" style={{ fontSize: "0.6rem", color: "#b0a088" }}>
                        <span className="badge-info">{l.ipAddress}</span>
                        <span style={{ color: "rgba(180,160,130,0.5)" }}>{new Date(l.createdAt).toLocaleString()}</span>
                        <span style={{ color: "rgba(180,160,130,0.35)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.userAgent}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  )
}
