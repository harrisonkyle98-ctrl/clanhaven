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
          "M6.5 25",
          "L6.5 14",
          "L6.5 10",
          "L6.5 8 L8.5 8 L8.5 10 L11 10 L11 8 L12.5 8 L12.5 10",
          "L12.5 14 L16 14",
          "L16 10",
          "L16 8 L17.5 8 L17.5 10 L19.5 10 L19.5 8",
          "L19.5 6",
          "L19.5 4 L21 4 L21 6 L23 6 L23 4",
          "L23 2 L23 1 L24 1 L24.5 1 L28.5 2 L24.5 3.5 L25 4",
          "L25 4 L27 4 L27 6 L28.5 6 L28.5 4",
          "L28.5 8",
          "L28.5 8 L30.5 8 L30.5 10 L32 10 L32 8 L32 14",
          "L35.5 14 L35.5 10",
          "L35.5 8 L37 8 L37 10 L39.5 10 L39.5 8 L41.5 8 L41.5 10",
          "L41.5 25",
          "Z",
        ].join(" ")}
        fill="#e8d5b0"
        opacity="0.9"
      />
      {/* Floating island silhouette — starts 1px below castle */}
      <path
        d={[
          "M3 26",
          "L45 26",
          "C45 26, 38 32, 28.5 38",
          "C26.5 40, 25 42, 24 44",
          "C23 42, 19.5 38, 19.5 38",
          "C10 32, 3 26, 3 26 Z",
        ].join(" ")}
        fill="#e8d5b0"
        opacity="0.9"
      />
    </svg>
  )
}
