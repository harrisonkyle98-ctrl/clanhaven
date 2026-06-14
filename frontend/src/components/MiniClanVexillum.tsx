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

      {/* Left banner — angled bottom toward pole */}
      <polygon
        points="3,7 17,7 17,22 3,28"
        fill={primaryColor}
      />

      {/* Right banner — angled bottom toward pole */}
      <polygon
        points="19,7 33,7 33,28 19,22"
        fill={secondaryColor}
      />

      {/* Vertical pole between banners, extending past the flags */}
      <rect x="17" y="7" width="2" height="27" rx="0.5" fill={accentColor} opacity="0.7" />
    </svg>
  )
}
