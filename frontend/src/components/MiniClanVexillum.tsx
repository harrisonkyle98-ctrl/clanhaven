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

      {/* Unified banner — centered notch at bottom */}
      <polygon
        points="3,7 33,7 33,28 18,22 3,28"
        fill={primaryColor}
      />
      {/* Secondary color right half overlay */}
      <polygon
        points="18,7 33,7 33,28 18,22"
        fill={secondaryColor}
      />
      {/* Horizontal accent band spanning full width */}
      <polygon
        points="3,14 33,14 33,17 3,17"
        fill={accentColor}
        opacity="0.4"
      />
    </svg>
  )
}
