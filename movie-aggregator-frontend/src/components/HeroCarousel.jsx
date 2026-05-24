import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Play, Star, Clock } from 'lucide-react'
import axios from 'axios'

const HeroCarousel = () => {
  const [slides, setSlides] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    loadCarousel()
  }, [])

  useEffect(() => {
    if (slides.length > 1 && !isHovered) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length)
      }, 5000) // Auto-advance every 5 seconds
      return () => clearInterval(interval)
    }
  }, [slides.length, isHovered])

  const loadCarousel = async () => {
    try {
      const { data } = await axios.get('/api/content/hero-carousel/active', { params: { sort: 'latest' } })
      setSlides(data || [])
    } catch (error) {
      console.error('Failed to load hero carousel:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }

  if (loading) {
    return (
      <div className="relative w-full h-[60vh] min-h-[500px] lg:h-[70vh] bg-[#0f0f1a] animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin"></div>
            <div className="text-[#666]">Загрузка...</div>
          </div>
        </div>
      </div>
    )
  }

  if (slides.length === 0) {
    return null
  }

  const currentSlide = slides[currentIndex]

  return (
    <div 
      className="relative w-full h-[60vh] min-h-[500px] lg:h-[70vh] overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Container */}
      <div className="absolute inset-0 overflow-hidden bg-[#0a0a0a]">
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentIndex 
                ? 'opacity-100 z-10 scale-100' 
                : 'opacity-0 z-0 scale-105 pointer-events-none'
            }`}
          >
            {/* Background Image with Ken Burns effect */}
            <div
              className={`absolute inset-0 bg-cover bg-center transition-transform duration-[8000ms] ease-out ${
                index === currentIndex ? 'scale-105' : 'scale-100'
              }`}
              style={{
                backgroundImage: `url(${slide.background_image || slide.content?.poster_url || 'https://placehold.co/1920x600/1e293b/ffffff?text=Hero'})`,
              }}
            >
              {/* Multi-layer gradient overlay to blend perfectly with Home's #0a0a0a background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/60 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-24 h-full flex items-center">
              <div className="max-w-3xl space-y-4 md:space-y-6">
                {/* Badge/Tag */}
                {slide.content?.content_type && (
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 md:px-4 py-1.5 rounded-full border border-white/20">
                    <span className="w-2 h-2 bg-[#ff6600] rounded-full animate-pulse"></span>
                    <span className="text-xs md:text-sm font-bold text-white/90 uppercase tracking-wider">
                      {slide.content.content_type === 'MOVIE' ? 'Фильм' : 
                       slide.content.content_type === 'TV_SERIES' ? 'Сериал' : 'Игра'}
                    </span>
                  </div>
                )}

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-[-0.02em] line-clamp-2 md:line-clamp-3">
                  <span className="bg-gradient-to-r from-white via-white/95 to-white/70 bg-clip-text text-transparent">
                    {slide.title}
                  </span>
                </h1>
                
                {slide.subtitle && (
                  <p className="text-lg md:text-2xl text-[#ff6600] font-semibold tracking-wide line-clamp-1">
                    {slide.subtitle}
                  </p>
                )}
                
                {/* Meta info */}
                {slide.content && (
                  <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm md:text-base font-medium">
                    {slide.content.release_year && (
                      <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-lg backdrop-blur-sm">
                        <Clock className="w-4 h-4 text-[#ff6600]" />
                        {slide.content.release_year}
                      </span>
                    )}
                    {slide.content.avg_rating && (
                      <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-lg backdrop-blur-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-white font-bold">{Number(slide.content.avg_rating).toFixed(1)}</span>
                      </span>
                    )}
                    {slide.content.genre && (
                      <span className="bg-black/40 px-3 py-1 rounded-lg backdrop-blur-sm text-white/90">
                        {slide.content.genre}
                      </span>
                    )}
                  </div>
                )}

                {slide.description && (
                  <p className="text-sm md:text-lg text-white/70 leading-relaxed max-w-2xl line-clamp-2 md:line-clamp-3">
                    {slide.description}
                  </p>
                )}

                {slide.call_to_action_link && (
                  <div className="flex flex-wrap items-center gap-4 pt-4 md:pt-6">
                    <Link
                      to={slide.call_to_action_link}
                      className="group/btn inline-flex items-center justify-center gap-3 bg-[#ff6600] hover:bg-[#ff7722] text-white px-6 md:px-8 py-3 md:py-4 rounded-md md:rounded-lg font-bold text-base md:text-lg transition-all duration-300 w-full sm:w-auto"
                    >
                      <div className="hidden md:flex w-10 h-10 bg-white/20 rounded-md items-center justify-center group-hover/btn:bg-white/10 transition-colors">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                      <span className="flex md:hidden items-center gap-2">
                        <Play className="w-4 h-4 fill-current" />
                      </span>
                      {slide.call_to_action_text || 'Смотреть'}
                    </Link>
                    
                    {/* Secondary button */}
                    <Link
                      to={slide.call_to_action_link || '/coming-soon'}
                      className="inline-flex justify-center items-center px-6 md:px-8 py-3 md:py-4 rounded-md md:rounded-lg font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 w-full sm:w-auto"
                    >
                      Подробнее
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows - Responsively elegant */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-30 w-10 md:w-14 h-10 md:h-14 bg-black/40 hover:bg-black/70 text-white rounded-full md:rounded-lg backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:scale-[1.05]"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 md:w-7 h-6 md:h-7" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-30 w-10 md:w-14 h-10 md:h-14 bg-black/40 hover:bg-black/70 text-white rounded-full md:rounded-lg backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:scale-[1.05]"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 md:w-7 h-6 md:h-7" />
            </button>
          </>
        )}

        {/* Progress Bar & Dots - Modern style */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-lg border border-white/10">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="relative h-1.5 rounded-full overflow-hidden transition-all duration-500"
                  style={{ width: index === currentIndex ? '48px' : '12px' }}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <div className="absolute inset-0 bg-white/30 rounded-full"></div>
                  {index === currentIndex && (
                    <div 
                      className="absolute inset-0 bg-[#ff6600] rounded-full origin-left"
                      style={{
                        animation: isHovered ? 'none' : 'progress 5s linear forwards'
                      }}
                    ></div>
                  )}
                </button>
              ))}
              
              {/* Slide counter */}
              <div className="text-white/60 text-sm font-medium ml-2 border-l border-white/20 pl-3">
                {String(currentIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS for progress animation */}
      <style>{`
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  )
}

export default HeroCarousel
