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
  size = 36,
  className,
}: MiniClanVexillumProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 36 36"
      role="img"
      aria-label="Clan vexillum"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="vex-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.45" />
        </filter>
        <linearGradient id="crossbar-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="pole-grad" x1="0" y1="4" x2="0" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="20%" stopColor="#000" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="banner-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.2" />
        </linearGradient>
        {/* Cloth texture — fine horizontal weave lines */}
        <pattern id="cloth-texture" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="1" x2="4" y2="1" stroke="#fff" strokeWidth="0.5" opacity="0.06" />
          <line x1="0" y1="3" x2="4" y2="3" stroke="#000" strokeWidth="0.5" opacity="0.08" />
        </pattern>
        {/* Cloth sheen — radial highlight like ribbon ambient glow */}
        <radialGradient id="cloth-sheen" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g filter="url(#vex-shadow)">
        {/* Horizontal crossbar with gradient */}
        <rect x="6" y="4" width="24" height="2" rx="0.5" fill={accentColor} opacity="0.7" />
        <rect x="6" y="4" width="24" height="2" rx="0.5" fill="url(#crossbar-grad)" />

        {/* Left banner — flat bottom (1px gap before pole, 1px gap below crossbar) */}
        <rect x="7" y="7" width="9" height="21" fill={primaryColor} />
        <rect x="7" y="7" width="9" height="21" fill="url(#banner-grad)" />
        <rect x="7" y="7" width="9" height="21" fill="url(#cloth-texture)" />
        <rect x="7" y="7" width="9" height="21" fill="url(#cloth-sheen)" />

        {/* Right banner — flat bottom (1px gap after pole, 1px gap below crossbar) */}
        <rect x="20" y="7" width="9" height="21" fill={secondaryColor} />
        <rect x="20" y="7" width="9" height="21" fill="url(#banner-grad)" />
        <rect x="20" y="7" width="9" height="21" fill="url(#cloth-texture)" />
        <rect x="20" y="7" width="9" height="21" fill="url(#cloth-sheen)" />

        {/* Vertical pole between banners, connecting to crossbar, extending past flags */}
        <rect x="17" y="6" width="2" height="26" rx="0.5" fill={accentColor} opacity="0.7" />
        <rect x="17" y="6" width="2" height="26" rx="0.5" fill="url(#pole-grad)" />
      </g>
    </svg>
  )
}
