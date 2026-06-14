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

      {/* Left banner panel — centered notch */}
      <polygon
        points="3,7 16,7 16,28 18,22 3,28"
        fill={primaryColor}
      />

      {/* Right banner panel — centered notch */}
      <polygon
        points="20,7 33,7 33,28 18,22 20,28"
        fill={secondaryColor}
      />

      {/* Vertical center line between banner halves */}
      <line x1="18" y1="7" x2="18" y2="22" stroke={accentColor} strokeWidth="1.5" opacity="0.6" />
    </svg>
  )
}
