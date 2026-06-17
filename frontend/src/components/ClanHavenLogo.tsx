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
      {/* Single continuous silhouette: castle on floating island */}
      <path
        d={[
          // Start bottom of island (inverted mountain point)
          "M24 44",
          // Left side of island going up
          "C20 38, 12 32, 6 28",
          // Island top left edge
          "L6 26",
          // Left castle wall base going up
          "L9 26 L9 16",
          // Left tower up
          "L9 12",
          // Left tower battlement
          "L9 10 L10.5 10 L10.5 12 L12.5 12 L12.5 10 L14 10 L14 12",
          // Wall to left-center section
          "L14 16 L17 16",
          // Left-center wall up
          "L17 12",
          // Left-center battlement
          "L17 10 L18.5 10 L18.5 12 L20 12 L20 10",
          // Central tower going up
          "L20 8",
          // Central battlements
          "L20 6 L21.5 6 L21.5 8 L23 8 L23 6",
          // Flag pole + pennant
          "L23 4 L23 2 L24 2 L24.5 2 L28 4 L24.5 5.5 L25 6",
          // Right side of central battlements
          "L25 6 L26.5 6 L26.5 8 L28 8 L28 6",
          // Central tower right side going down
          "L28 10",
          // Right-center battlement
          "L28 10 L29.5 10 L29.5 12 L31 12 L31 10 L31 16",
          // Wall to right tower
          "L34 16 L34 12",
          // Right tower battlement
          "L34 10 L35.5 10 L35.5 12 L37.5 12 L37.5 10 L39 10 L39 12",
          // Right tower down
          "L39 26",
          // Island top right edge
          "L42 26",
          // Right side of island going down to point
          "C42 26, 36 32, 28 38",
          // Close back to bottom point
          "C26 40, 25 42, 24 44 Z",
        ].join(" ")}
        fill="#e8d5b0"
        opacity="0.9"
      />
    </svg>
  )
}
