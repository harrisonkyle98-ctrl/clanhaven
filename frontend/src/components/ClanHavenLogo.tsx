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
          "L9 14",
          "L9 10",
          "L9 8 L10.5 8 L10.5 10 L12.5 10 L12.5 8 L14 8 L14 10",
          "L14 14 L17 14",
          "L17 10",
          "L17 8 L18.5 8 L18.5 10 L20 10 L20 8",
          "L20 6",
          "L20 4 L21.5 4 L21.5 6 L23 6 L23 4",
          "L23 2 L23 1 L24 1 L24.5 1 L28 2 L24.5 3.5 L25 4",
          "L25 4 L26.5 4 L26.5 6 L28 6 L28 4",
          "L28 8",
          "L28 8 L29.5 8 L29.5 10 L31 10 L31 8 L31 14",
          "L34 14 L34 10",
          "L34 8 L35.5 8 L35.5 10 L37.5 10 L37.5 8 L39 8 L39 10",
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
