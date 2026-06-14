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
      </defs>

      <g filter="url(#vex-shadow)">
        {/* Horizontal crossbar */}
        <rect x="6" y="4" width="24" height="3" rx="1" fill={accentColor} />

        {/* Left banner — flat bottom (1px gap before pole, 1px gap below crossbar) */}
        <rect x="7" y="8" width="9" height="20" fill={primaryColor} />

        {/* Right banner — flat bottom (1px gap after pole, 1px gap below crossbar) */}
        <rect x="20" y="8" width="9" height="20" fill={secondaryColor} />

        {/* Vertical pole between banners, extending past the flags */}
        <rect x="17" y="8" width="2" height="24" rx="0.5" fill={accentColor} opacity="0.7" />
      </g>
    </svg>
  )
}
