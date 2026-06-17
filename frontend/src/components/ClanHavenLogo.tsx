interface ClanHavenLogoProps {
  size?: number
  className?: string
}

export default function ClanHavenLogo({ size = 36, className = "" }: ClanHavenLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Clan Haven logo"
    >
      {/* Floating island base */}
      <path
        d="M8 34 C8 34, 14 38, 24 38 C34 38, 40 34, 40 34 L36 42 C36 42, 30 44, 24 44 C18 44, 12 42, 12 42 Z"
        fill="#b0a088"
        stroke="#e8d5b0"
        strokeWidth="0.6"
        opacity="0.7"
      />
      {/* Island top surface */}
      <path
        d="M8 34 C8 34, 14 36, 24 36 C34 36, 40 34, 40 34 C40 33, 34 31, 24 31 C14 31, 8 33, 8 34 Z"
        fill="#c9b890"
        stroke="#e8d5b0"
        strokeWidth="0.4"
        opacity="0.8"
      />

      {/* Castle main body */}
      <rect x="16" y="18" width="16" height="14" rx="0.5" fill="#b0a088" stroke="#e8d5b0" strokeWidth="0.7" />

      {/* Castle gate arch */}
      <path
        d="M21 32 L21 25 C21 23.5, 22 22.5, 24 22.5 C26 22.5, 27 23.5, 27 25 L27 32"
        fill="#6b5a42"
        stroke="#e8d5b0"
        strokeWidth="0.5"
      />

      {/* Left tower */}
      <rect x="12" y="14" width="7" height="18" rx="0.5" fill="#a09070" stroke="#e8d5b0" strokeWidth="0.7" />
      {/* Left tower battlements */}
      <rect x="12" y="12.5" width="2" height="2.5" fill="#a09070" stroke="#e8d5b0" strokeWidth="0.5" />
      <rect x="15.5" y="12.5" width="2" height="2.5" fill="#a09070" stroke="#e8d5b0" strokeWidth="0.5" />
      <rect x="12" y="12" width="7" height="1.5" fill="#b0a088" stroke="#e8d5b0" strokeWidth="0.4" />

      {/* Right tower */}
      <rect x="29" y="14" width="7" height="18" rx="0.5" fill="#a09070" stroke="#e8d5b0" strokeWidth="0.7" />
      {/* Right tower battlements */}
      <rect x="29" y="12.5" width="2" height="2.5" fill="#a09070" stroke="#e8d5b0" strokeWidth="0.5" />
      <rect x="32.5" y="12.5" width="2" height="2.5" fill="#a09070" stroke="#e8d5b0" strokeWidth="0.5" />
      <rect x="29" y="12" width="7" height="1.5" fill="#b0a088" stroke="#e8d5b0" strokeWidth="0.4" />

      {/* Central tower / keep */}
      <rect x="20" y="8" width="8" height="12" rx="0.5" fill="#b0a088" stroke="#e8d5b0" strokeWidth="0.7" />
      {/* Central tower battlements */}
      <rect x="20" y="6.5" width="2" height="2.5" fill="#b0a088" stroke="#e8d5b0" strokeWidth="0.5" />
      <rect x="23" y="6.5" width="2" height="2.5" fill="#b0a088" stroke="#e8d5b0" strokeWidth="0.5" />
      <rect x="26" y="6.5" width="2" height="2.5" fill="#b0a088" stroke="#e8d5b0" strokeWidth="0.5" />
      <rect x="20" y="6" width="8" height="1.5" fill="#c9b890" stroke="#e8d5b0" strokeWidth="0.4" />

      {/* Flag pole + pennant */}
      <line x1="24" y1="2" x2="24" y2="7" stroke="#e8d5b0" strokeWidth="0.8" />
      <path d="M24.5 2.5 L28 4 L24.5 5.5 Z" fill="#e8d5b0" opacity="0.9" />

      {/* Gold accent line across castle front */}
      <line x1="16.5" y1="19" x2="31.5" y2="19" stroke="#e8d5b0" strokeWidth="0.6" opacity="0.5" />

      {/* Tower window slits */}
      <rect x="14.5" y="18" width="1" height="3" rx="0.3" fill="#6b5a42" opacity="0.7" />
      <rect x="14.5" y="24" width="1" height="3" rx="0.3" fill="#6b5a42" opacity="0.7" />
      <rect x="32.5" y="18" width="1" height="3" rx="0.3" fill="#6b5a42" opacity="0.7" />
      <rect x="32.5" y="24" width="1" height="3" rx="0.3" fill="#6b5a42" opacity="0.7" />

      {/* Central tower window */}
      <rect x="23" y="10" width="2" height="3" rx="0.5" fill="#6b5a42" opacity="0.7" />

      {/* Subtle magic glow under island */}
      <ellipse cx="24" cy="42" rx="10" ry="2.5" fill="#8a9acd" opacity="0.12" />
    </svg>
  )
}
