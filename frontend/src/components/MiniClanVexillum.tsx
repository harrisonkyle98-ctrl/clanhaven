type MiniClanVexillumProps = {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  size?: number
  className?: string
}

export function MiniClanVexillum({
  primaryColor = "#2f3f7f",
  secondaryColor = "#7d5a24",
  accentColor = "#c9a24a",
  size = 72,
  className,
}: MiniClanVexillumProps) {
  const width = Math.round(size * 0.5)

  return (
    <svg
      className={className}
      width={width}
      height={size}
      viewBox="0 0 24 48"
      role="img"
      aria-label="Clan vexillum"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="vex-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.6" floodColor="#000" floodOpacity="0.5" />
        </filter>
        <linearGradient id="pole-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="30%" stopColor="#fff" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="crossbar-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="banner-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="border-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id="cloth-sheen" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g filter="url(#vex-shadow)">
        {/* Pole — runs full height behind everything */}
        <rect x="11" y="3" width="2" height="43" rx="0.5" fill={accentColor} opacity="0.75" />
        <rect x="11" y="3" width="2" height="43" rx="0.5" fill="url(#pole-grad)" />

        {/* Finial/spear point at top of pole */}
        <polygon points="12,0.5 13.5,3 10.5,3" fill={accentColor} opacity="0.85" />
        <polygon points="12,1.5 13,3 11,3" fill="#fff" opacity="0.1" />

        {/* Top crossbar with spear points at ends */}
        <rect x="1" y="4.5" width="22" height="1.5" rx="0.4" fill={accentColor} opacity="0.75" />
        <rect x="1" y="4.5" width="22" height="1.5" rx="0.4" fill="url(#crossbar-grad)" />
        {/* Top crossbar left spear point */}
        <polygon points="0,5.25 1.5,4.25 1.5,6.25" fill={accentColor} opacity="0.85" />
        {/* Top crossbar right spear point */}
        <polygon points="24,5.25 22.5,4.25 22.5,6.25" fill={accentColor} opacity="0.85" />

        {/* Bottom crossbar for small banners — drawn before banners so banners sit on top */}
        <rect x="1" y="14" width="22" height="1.5" rx="0.4" fill={accentColor} opacity="0.75" />
        <rect x="1" y="14" width="22" height="1.5" rx="0.4" fill="url(#crossbar-grad)" />
        {/* Bottom crossbar left spear point */}
        <polygon points="0,14.75 1.5,13.75 1.5,15.75" fill={accentColor} opacity="0.85" />
        {/* Bottom crossbar right spear point */}
        <polygon points="24,14.75 22.5,13.75 22.5,15.75" fill={accentColor} opacity="0.85" />

        {/* Two small top banners — sit on top of both crossbars */}
        {/* Left small banner — border */}
        <rect x="1.5" y="4.5" width="10" height="11" fill={secondaryColor} />
        <rect x="1.5" y="4.5" width="10" height="11" fill="url(#border-grad)" />
        {/* Left small banner — primary fill inset */}
        <rect x="2.5" y="5.5" width="8" height="9" fill={primaryColor} />
        <rect x="2.5" y="5.5" width="8" height="9" fill="url(#banner-grad)" />
        <rect x="2.5" y="5.5" width="8" height="9" fill="url(#cloth-sheen)" />

        {/* Right small banner — border */}
        <rect x="12.5" y="4.5" width="10" height="11" fill={secondaryColor} />
        <rect x="12.5" y="4.5" width="10" height="11" fill="url(#border-grad)" />
        {/* Right small banner — primary fill inset */}
        <rect x="13.5" y="5.5" width="8" height="9" fill={primaryColor} />
        <rect x="13.5" y="5.5" width="8" height="9" fill="url(#banner-grad)" />
        <rect x="13.5" y="5.5" width="8" height="9" fill="url(#cloth-sheen)" />

        {/* Upper crossbar for large banner — no spear points, banner sits below */}
        <rect x="5" y="16.5" width="14" height="1" rx="0.3" fill={accentColor} />
        <rect x="5" y="16.5" width="14" height="1" rx="0.3" fill="url(#crossbar-grad)" />

        {/* Large main banner — sits between upper and lower crossbars */}
        <rect x="6" y="17.5" width="12" height="21" fill={secondaryColor} />
        <rect x="6" y="17.5" width="12" height="21" fill="url(#border-grad)" />
        {/* Main banner — primary fill inset */}
        <rect x="7" y="18.5" width="10" height="19" fill={primaryColor} />
        <rect x="7" y="18.5" width="10" height="19" fill="url(#banner-grad)" />
        <rect x="7" y="18.5" width="10" height="19" fill="url(#cloth-sheen)" />

        {/* Lower crossbar for large banner — no spear points, sits below banner */}
        <rect x="5" y="38.5" width="14" height="1" rx="0.3" fill={accentColor} />
        <rect x="5" y="38.5" width="14" height="1" rx="0.3" fill="url(#crossbar-grad)" />
      </g>
    </svg>
  )
}
