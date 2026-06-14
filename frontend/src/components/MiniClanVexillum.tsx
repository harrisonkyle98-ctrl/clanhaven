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
      {/* Horizontal crossbar */}
      <rect x="2" y="4" width="32" height="3" rx="1" fill={accentColor} />
      <rect x="3" y="5" width="30" height="1" rx="0.5" fill={accentColor} opacity="0.5" />

      {/* Center finial knob */}
      <circle cx="18" cy="4" r="2.5" fill={accentColor} />
      <circle cx="18" cy="4" r="1.2" fill={secondaryColor} />

      {/* Left banner panel — forked bottom */}
      <polygon
        points="3,7 16,7 16,28 12,24 3,28"
        fill={primaryColor}
      />
      {/* Left banner horizontal accent band */}
      <polygon
        points="3,14 16,14 16,17 3,17"
        fill={accentColor}
        opacity="0.4"
      />

      {/* Right banner panel — forked bottom */}
      <polygon
        points="20,7 33,7 33,28 24,24 20,28"
        fill={secondaryColor}
      />
      {/* Right banner horizontal accent band */}
      <polygon
        points="20,14 33,14 33,17 20,17"
        fill={accentColor}
        opacity="0.4"
      />

      {/* Center connector between banners */}
      <rect x="16" y="7" width="4" height="25" fill={accentColor} opacity="0.2" />
      <line x1="18" y1="7" x2="18" y2="32" stroke={accentColor} strokeWidth="1.5" opacity="0.6" />

      {/* Bottom finial */}
      <circle cx="18" cy="33" r="1.5" fill={accentColor} opacity="0.7" />
    </svg>
  )
}
