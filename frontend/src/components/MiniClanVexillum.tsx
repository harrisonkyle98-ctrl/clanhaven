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
        <radialGradient id="cloth-sheen" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g filter="url(#vex-shadow)">
        {/* Pole — runs full height behind everything */}
        <rect x="11" y="3" width="2" height="43" rx="0.5" fill={accentColor} opacity="0.75" />
        <rect x="11" y="3" width="2" height="43" rx="0.5" fill="url(#pole-grad)" />

        {/* Finial/spear point at top */}
        <polygon points="12,0.5 13.5,3 10.5,3" fill={accentColor} opacity="0.85" />
        <polygon points="12,1.5 13,3 11,3" fill="#fff" opacity="0.1" />

        {/* Horizontal crossbar */}
        <rect x="3" y="5" width="18" height="1.5" rx="0.4" fill={accentColor} opacity="0.75" />
        <rect x="3" y="5" width="18" height="1.5" rx="0.4" fill="url(#crossbar-grad)" />
        {/* Crossbar end caps */}
        <circle cx="3.5" cy="5.75" r="1" fill={accentColor} opacity="0.8" />
        <circle cx="20.5" cy="5.75" r="1" fill={accentColor} opacity="0.8" />

        {/* Two small top banners — secondary border, primary fill */}
        {/* Left small banner — border */}
        <rect x="3.5" y="7" width="8.5" height="9" fill={secondaryColor} />
        {/* Left small banner — primary fill inset */}
        <rect x="4.5" y="8" width="6.5" height="7" fill={primaryColor} />
        <rect x="4.5" y="8" width="6.5" height="7" fill="url(#banner-grad)" />
        <rect x="4.5" y="8" width="6.5" height="7" fill="url(#cloth-sheen)" />

        {/* Right small banner — border */}
        <rect x="12" y="7" width="8.5" height="9" fill={secondaryColor} />
        {/* Right small banner — primary fill inset */}
        <rect x="13" y="8" width="6.5" height="7" fill={primaryColor} />
        <rect x="13" y="8" width="6.5" height="7" fill="url(#banner-grad)" />
        <rect x="13" y="8" width="6.5" height="7" fill="url(#cloth-sheen)" />

        {/* Large main banner — secondary border, primary fill */}
        <rect x="5" y="17" width="14" height="22" fill={secondaryColor} />
        {/* Main banner — primary fill inset */}
        <rect x="6" y="18" width="12" height="20" fill={primaryColor} />
        <rect x="6" y="18" width="12" height="20" fill="url(#banner-grad)" />
        <rect x="6" y="18" width="12" height="20" fill="url(#cloth-sheen)" />
      </g>
    </svg>
  )
}
