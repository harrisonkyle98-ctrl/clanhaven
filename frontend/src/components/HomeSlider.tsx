import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "@/lib/api"

interface SliderImageData {
  id: string
  imageUrl: string
  title: string
  displayOrder: number
}

interface Slide {
  title: string
  description: string
  meta: string
  cta: string
  imageGradient: string
}

const fallbackSlides: Slide[] = [
  {
    title: "Discover RuneScape Clans",
    description:
      "Browse hundreds of active clans across RS3 and OSRS. Find your perfect community and join the adventure.",
    meta: "847 clans tracked",
    cta: "Browse Clans",
    imageGradient:
      "linear-gradient(135deg, rgba(30, 58, 95, 0.9) 0%, rgba(15, 30, 50, 0.95) 100%)",
  },
  {
    title: "Track Community Progress",
    description:
      "Monitor XP gains, skill milestones, and clan growth in real time. Stay connected to your community's achievements.",
    meta: "89.2B XP gained this week",
    cta: "View Rankings",
    imageGradient:
      "linear-gradient(135deg, rgba(50, 75, 35, 0.9) 0%, rgba(20, 35, 15, 0.95) 100%)",
  },
  {
    title: "Compete Together",
    description:
      "Create and join skill competitions. Challenge rival clans and push your members to new heights.",
    meta: "234 active competitions",
    cta: "Explore Competitions",
    imageGradient:
      "linear-gradient(135deg, rgba(95, 55, 25, 0.9) 0%, rgba(45, 25, 10, 0.95) 100%)",
  },
  {
    title: "Build Your Clan Portal",
    description:
      "Set up a dedicated hub for your clan. Share news, track members, and manage events all in one place.",
    meta: "142,380 players tracked",
    cta: "Get Started",
    imageGradient:
      "linear-gradient(135deg, rgba(70, 30, 80, 0.9) 0%, rgba(30, 12, 40, 0.95) 100%)",
  },
]

export default function HomeSlider() {
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [dbImages, setDbImages] = useState<SliderImageData[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    apiFetch<SliderImageData[]>("/api/news/slider-images")
      .then(setDbImages)
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const useFallback = !loaded || dbImages.length === 0
  const totalSlides = useFallback ? fallbackSlides.length : dbImages.length

  const goTo = useCallback(
    (index: number) => {
      if (transitioning || index === current) return
      setTransitioning(true)
      setTimeout(() => {
        setCurrent(index)
        setTransitioning(false)
      }, 300)
    },
    [transitioning, current]
  )

  const next = useCallback(() => {
    goTo((current + 1) % totalSlides)
  }, [current, goTo, totalSlides])

  const prev = useCallback(() => {
    goTo((current - 1 + totalSlides) % totalSlides)
  }, [current, goTo, totalSlides])

  useEffect(() => {
    if (totalSlides <= 1) return
    const timer = setInterval(next, 6000)
    return () => clearInterval(timer)
  }, [next, totalSlides])

  if (useFallback) {
    const slide = fallbackSlides[current]
    return (
      <div className="ch-home-slider">
        <div
          className="ch-home-slider-inner"
          style={{ opacity: transitioning ? 0 : 1 }}
        >
          <div className="ch-home-slider-image">
            <div
              className="ch-home-slider-image-bg"
              style={{ background: slide.imageGradient }}
            />
          </div>
          <div className="ch-home-slider-text">
            <h3 className="ch-home-slider-title">{slide.title}</h3>
            <p className="ch-home-slider-desc">{slide.description}</p>
            <div className="ch-home-slider-footer">
              <span className="ch-home-slider-meta">{slide.meta}</span>
              <button className="ch-home-slider-cta">{slide.cta}</button>
            </div>
          </div>
        </div>
        <button
          className="ch-home-slider-arrow ch-home-slider-arrow--prev"
          onClick={prev}
          aria-label="Previous slide"
        >
          <span className="text-sm">‹</span>
        </button>
        <button
          className="ch-home-slider-arrow ch-home-slider-arrow--next"
          onClick={next}
          aria-label="Next slide"
        >
          <span className="text-sm">›</span>
        </button>
        <div className="ch-home-slider-dots">
          {fallbackSlides.map((_, i) => (
            <button
              key={i}
              className={`ch-home-slider-dot ${i === current ? "ch-home-slider-dot--active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    )
  }

  const img = dbImages[current]
  return (
    <div className="ch-home-slider">
      <div
        className="ch-home-slider-inner ch-home-slider-inner--db"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        <img
          src={img.imageUrl}
          alt={img.title}
          className="ch-home-slider-db-img"
        />
        {img.title && (
          <div className="ch-home-slider-db-overlay">
            <h3 className="ch-home-slider-title">{img.title}</h3>
          </div>
        )}
      </div>
      {totalSlides > 1 && (
        <>
          <button
            className="ch-home-slider-arrow ch-home-slider-arrow--prev"
            onClick={prev}
            aria-label="Previous slide"
          >
            <span className="text-sm">‹</span>
          </button>
          <button
            className="ch-home-slider-arrow ch-home-slider-arrow--next"
            onClick={next}
            aria-label="Next slide"
          >
            <span className="text-sm">›</span>
          </button>
          <div className="ch-home-slider-dots">
            {dbImages.map((_, i) => (
              <button
                key={i}
                className={`ch-home-slider-dot ${i === current ? "ch-home-slider-dot--active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
