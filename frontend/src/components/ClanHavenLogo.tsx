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
      {/* Castle silhouette — stops 1px above island */}
      <path
        d={[
          "M9 25",
          "L9 16",
          "L9 12",
          "L9 10 L10.5 10 L10.5 12 L12.5 12 L12.5 10 L14 10 L14 12",
          "L14 16 L17 16",
          "L17 12",
          "L17 10 L18.5 10 L18.5 12 L20 12 L20 10",
          "L20 8",
          "L20 6 L21.5 6 L21.5 8 L23 8 L23 6",
          "L23 4 L23 2 L24 2 L24.5 2 L28 4 L24.5 5.5 L25 6",
          "L25 6 L26.5 6 L26.5 8 L28 8 L28 6",
          "L28 10",
          "L28 10 L29.5 10 L29.5 12 L31 12 L31 10 L31 16",
          "L34 16 L34 12",
          "L34 10 L35.5 10 L35.5 12 L37.5 12 L37.5 10 L39 10 L39 12",
          "L39 25",
          "Z",
        ].join(" ")}
        fill="#e8d5b0"
        opacity="0.9"
      />
      {/* Floating island silhouette — starts 1px below castle */}
      <path
        d={[
          "M6 26",
          "L42 26",
          "C42 26, 36 32, 28 38",
          "C26 40, 25 42, 24 44",
          "C23 42, 20 38, 20 38",
          "C12 32, 6 26, 6 26 Z",
        ].join(" ")}
        fill="#e8d5b0"
        opacity="0.9"
      />
    </svg>
  )
}
