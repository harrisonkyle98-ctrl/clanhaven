import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "@/lib/api"

interface Slide {
  title: string
  description: string
  meta: string
  cta: string
  imageUrl: string
  imageGradient: string
}

const fallbackSlides: Slide[] = [
  {
    title: "Discover RuneScape Clans",
    description:
      "Browse hundreds of active clans across RS3 and OSRS. Find your perfect community and join the adventure.",
    meta: "847 clans tracked",
    cta: "Browse Clans",
    imageUrl: "",
    imageGradient:
      "linear-gradient(135deg, rgba(30, 58, 95, 0.9) 0%, rgba(15, 30, 50, 0.95) 100%)",
  },
  {
    title: "Track Community Progress",
    description:
      "Monitor XP gains, skill milestones, and clan growth in real time. Stay connected to your community's achievements.",
    meta: "89.2B XP gained this week",
    cta: "View Rankings",
    imageUrl: "",
    imageGradient:
      "linear-gradient(135deg, rgba(50, 75, 35, 0.9) 0%, rgba(20, 35, 15, 0.95) 100%)",
  },
  {
    title: "Compete Together",
    description:
      "Create and join skill competitions. Challenge rival clans and push your members to new heights.",
    meta: "234 active competitions",
    cta: "Explore Competitions",
    imageUrl: "",
    imageGradient:
      "linear-gradient(135deg, rgba(95, 55, 25, 0.9) 0%, rgba(45, 25, 10, 0.95) 100%)",
  },
  {
    title: "Build Your Clan Portal",
    description:
      "Set up a dedicated hub for your clan. Share news, track members, and manage events all in one place.",
    meta: "142,380 players tracked",
    cta: "Get Started",
    imageUrl: "",
    imageGradient:
      "linear-gradient(135deg, rgba(70, 30, 80, 0.9) 0%, rgba(30, 12, 40, 0.95) 100%)",
  },
]

interface ApiSlide {
  id: string
  imageUrl: string
  title: string
  description: string
  meta: string
  cta: string
  imageGradient: string
  displayOrder: number
}

export default function HomeSlider() {
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides)

  useEffect(() => {
    apiFetch<ApiSlide[]>("/api/news/slider-images")
      .then((data) => {
        if (data.length > 0) {
          setSlides(
            data.map((s) => ({
              title: s.title,
              description: s.description,
              meta: s.meta,
              cta: s.cta,
              imageUrl: s.imageUrl,
              imageGradient: s.imageGradient,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

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
    goTo((current + 1) % slides.length)
  }, [current, goTo, slides.length])

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length)
  }, [current, goTo, slides.length])

  useEffect(() => {
    const timer = setInterval(next, 6000)
    return () => clearInterval(timer)
  }, [next])

  const slide = slides[current]

  return (
    <div className="ch-home-slider">
      <div
        className="ch-home-slider-inner"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        {/* Left: image area */}
        <div className="ch-home-slider-image">
          {slide.imageUrl ? (
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="ch-home-slider-image-bg"
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          ) : (
            <div
              className="ch-home-slider-image-bg"
              style={{ background: slide.imageGradient }}
            />
          )}
        </div>

        {/* Right: text area */}
        <div className="ch-home-slider-text">
          <h3 className="ch-home-slider-title">{slide.title}</h3>
          <p className="ch-home-slider-desc">{slide.description}</p>
          <div className="ch-home-slider-footer">
            <span className="ch-home-slider-meta">{slide.meta}</span>
            <button className="ch-home-slider-cta">{slide.cta}</button>
          </div>
        </div>
      </div>

      {/* Controls */}
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

      {/* Dots */}
      <div className="ch-home-slider-dots">
        {slides.map((_, i) => (
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
