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

      {/* Left banner — flat bottom */}
      <rect x="3" y="7" width="14" height="21" fill={primaryColor} />

      {/* Right banner — flat bottom */}
      <rect x="19" y="7" width="14" height="21" fill={secondaryColor} />

      {/* Vertical pole between banners, extending slightly past the flags */}
      <rect x="17" y="7" width="2" height="22" rx="0.5" fill={accentColor} opacity="0.7" />
    </svg>
  )
}
