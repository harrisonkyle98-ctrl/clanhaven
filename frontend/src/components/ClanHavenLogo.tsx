interface ClanHavenLogoProps {
  size?: number
  className?: string
}

export default function ClanHavenLogo({ size = 36, className = "" }: ClanHavenLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Clan Haven logo"
    >
      {/* Citadel silhouette — outer wall with towers + inner keep with spire */}
      <path
        d={[
          "M4 25",
          // Left outer tower — peaked roof
          "L4 17 L6.5 13 L9 17",
          // Left outer wall — battlements
          "L9 21",
          "L10.5 21 L10.5 19 L12 19 L12 21",
          "L13.5 21 L13.5 19 L15 19 L15 21",
          // Left inner tower — peaked roof
          "L15 10 L17.5 6 L20 10",
          // Central keep — battlements + central spire
          "L20 5",
          "L20 3 L22 3 L22 5",
          "L23 5 L24 1.5 L25 5",
          "L26 5 L26 3 L28 3 L28 5",
          // Right inner tower — peaked roof
          "L28 10 L30.5 6 L33 10",
          // Right outer wall — battlements
          "L33 21",
          "L34.5 21 L34.5 19 L36 19 L36 21",
          "L37.5 21 L37.5 19 L39 19 L39 21",
          // Right outer tower — peaked roof
          "L39 17 L41.5 13 L44 17",
          "L44 25",
          "Z",
        ].join(" ")}
        fill="#e8d5b0"
        opacity="0.9"
      />
      {/* Flags on tower peaks */}
      <path d="M6.5 13 L6.5 10 L9 11 Z" fill="#e8d5b0" opacity="0.9" />
      <path d="M17.5 6 L17.5 3 L20 4 Z" fill="#e8d5b0" opacity="0.9" />
      <path d="M24 1.5 L24 0 L26 0.5 Z" fill="#e8d5b0" opacity="0.9" />
      <path d="M30.5 6 L30.5 3 L28 4 Z" fill="#e8d5b0" opacity="0.9" />
      <path d="M41.5 13 L41.5 10 L39 11 Z" fill="#e8d5b0" opacity="0.9" />
      {/* Floating island — inverted mountain */}
      <path
        d={[
          "M2 26",
          "L46 26",
          "C46 26, 38 32, 30 38",
          "C27 40, 25 42, 24 44",
          "C23 42, 21 40, 18 38",
          "C10 32, 2 26, 2 26 Z",
        ].join(" ")}
        fill="#e8d5b0"
        opacity="0.9"
      />
    </svg>
  )
}
