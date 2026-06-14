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
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 72 72"
      role="img"
      aria-label="Clan vexillum"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Staff pole */}
      <rect x="34" y="4" width="4" height="64" rx="1.5" fill={secondaryColor} />
      <rect x="35" y="4" width="1.5" height="64" rx="0.75" fill={accentColor} opacity="0.3" />

      {/* Pole cap — ornamental finial */}
      <circle cx="36" cy="6" r="4" fill={accentColor} />
      <circle cx="36" cy="6" r="2" fill={secondaryColor} />

      {/* Banner flag — pointed pennant shape */}
      <polygon
        points="12,12 34,12 34,44 12,36"
        fill={primaryColor}
      />
      {/* Diagonal accent stripe on banner */}
      <polygon
        points="12,12 34,12 34,20 12,20"
        fill={accentColor}
        opacity="0.5"
      />
      {/* Center horizontal band */}
      <polygon
        points="12,25 34,25 34,31 12,28.5"
        fill={secondaryColor}
        opacity="0.6"
      />

      {/* Accent trim along top edge of banner */}
      <line x1="12" y1="12" x2="34" y2="12" stroke={accentColor} strokeWidth="1.5" />
      {/* Accent trim along staff-side edge */}
      <line x1="34" y1="12" x2="34" y2="44" stroke={accentColor} strokeWidth="1" opacity="0.6" />

      {/* Small crossbar on staff below banner */}
      <rect x="30" y="46" width="12" height="2" rx="1" fill={secondaryColor} />
      <rect x="31" y="46.5" width="10" height="1" rx="0.5" fill={accentColor} opacity="0.4" />
    </svg>
  )
}
