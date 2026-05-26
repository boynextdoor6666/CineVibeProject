import os

def update_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# -------------- NAVBAR --------------
navbar_content = '''import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Menu, X, Film, User, Star, Tv, Gamepad2, Sparkles, Calendar, LogOut, LogIn, Shield, Flame, Heart, Globe, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  const navItems = [
    { path: '/critics', label: 'Критики', icon: Star },
    { path: '/analytics', label: 'Аналитика', icon: Globe },
    { path: '/world-ratings', label: 'Мир оценок', icon: Zap },
    { path: '/taste-profile', label: 'Мой вкус', icon: Heart },
    { path: '/hype-monitoring', label: 'Хайп', icon: Flame },
    { path: '/coming-soon', label: 'Скоро выйдет', icon: Calendar },
  ]

  const contentItems = [
    { path: '/', label: 'Все', icon: Sparkles },
    { path: '/movies', label: 'Фильмы', icon: Film },
    { path: '/series', label: 'Сериалы', icon: Tv },
    { path: '/games', label: 'Игры', icon: Gamepad2 },
  ]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true)
        try {
          const { data } = await axios.get('/api/content/autocomplete', {
            params: { q: searchQuery, limit: 8 }
          })
          setSearchResults(data || [])
          setShowSuggestions(true)
        } catch (error) {
          console.error('Search error:', error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowSuggestions(false)
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  const handleSelectContent = (contentId) => {
    setSearchQuery('')
    setShowSuggestions(false)
    setSearchResults([])
    navigate(/content/)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      navigate(/search?q=)
    }
  }

  const getContentTypeIcon = (type) => {
    switch(type) {
      case 'MOVIE': return <Film className="h-4 w-4" />
      case 'TV_SERIES': return <Tv className="h-4 w-4" />
      case 'GAME': return <Gamepad2 className="h-4 w-4" />
      default: return <Film className="h-4 w-4" />
    }
  }

  const getContentTypeLabel = (type) => {
    switch(type) {
      case 'MOVIE': return 'Фильм'
      case 'TV_SERIES': return 'Сериал'
      case 'GAME': return 'Игра'
      default: return type
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActivePath = (path) => location.pathname === path

  return (
    <nav className="bg-white/80 border-b border-gray-200 sticky top-0 z-50 backdrop-blur-xl transition-all duration-300 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center group shrink-0">
            <span className="text-2xl font-black tracking-tight text-indigo-600">CineVibe</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl mx-8" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Поиск фильмов, сериалов, игр..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border border-transparent rounded-full text-gray-900 placeholder-gray-500
                         focus:outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
              />
              
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-96 overflow-y-auto z-50 overflow-hidden">
                  {isSearching ? (
                    <div className="px-4 py-3 text-center text-gray-500">
                      <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelectContent(result.id)}
                          className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          {result.poster_url ? (
                            <img 
                              src={result.poster_url} 
                              alt={result.title}
                              className="w-10 h-14 object-cover rounded-md shadow-sm"
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          ) : (
                            <div className="w-10 h-14 bg-gray-100 rounded-md flex items-center justify-center">
                              {getContentTypeIcon(result.content_type)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{result.title}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-1 font-medium">
                              <span className="flex items-center gap-1 text-indigo-600">
                                {getContentTypeIcon(result.content_type)}
                                {getContentTypeLabel(result.content_type)}
                              </span>
                              {result.release_year && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span>{result.release_year}</span>
                                </>
                              )}
                              {result.avg_rating > 0 && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="flex items-center gap-1 font-bold text-amber-500">
                                    <Star className="h-3 w-3 fill-amber-500" />
                                    {Number(result.avg_rating).toFixed(1)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                      {searchQuery.trim() && (
                        <button
                          onClick={handleSearchSubmit}
                          className="w-full px-4 py-3 mt-1 bg-gray-50 text-sm font-semibold text-indigo-600 hover:bg-gray-100 transition-colors text-center border-t border-gray-100"
                        >
                          Показать все результаты
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500 font-medium">
                      Ничего не найдено
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="hidden md:flex items-center space-x-2 ml-auto">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-2">
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg font-semibold text-sm text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Админ</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg font-semibold text-sm text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  <User className="h-4 w-4" />
                  <span>{user?.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg font-semibold text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-2">
                <Link
                  to="/login"
                  className="font-semibold text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Вход
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
'''

# -------------- HERO CAROUSEL --------------
hero_content = '''import React, { useState, useEffect } from 'react'
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
      }, 5000)
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

  const goToSlide = (index) => setCurrentIndex(index)
  const goToPrevious = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % slides.length)

  if (loading) {
    return (
      <div className="relative w-full h-[50vh] min-h-[400px] lg:h-[60vh] bg-gray-100 animate-pulse rounded-3xl mt-4 mx-4 shadow-sm">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (slides.length === 0) return null

  const currentSlide = slides[currentIndex]

  return (
    <div className="px-4 py-6">
      <div 
        className="relative w-full h-[50vh] min-h-[400px] lg:h-[60vh] rounded-3xl overflow-hidden group shadow-xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute inset-0 overflow-hidden bg-gray-900">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={bsolute inset-0 transition-opacity duration-700 ease-in-out }
            >
              <div
                className={bsolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-out }
                style={{
                  backgroundImage: url(),
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/40 to-transparent"></div>
              </div>

              <div className="relative z-20 w-full max-w-7xl mx-auto px-8 md:px-16 h-full flex flex-col justify-end pb-16 lg:pb-24">
                <span className="inline-block px-3 py-1 mb-4 text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full w-max backdrop-blur-md">
                  Эксклюзив
                </span>
                
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white leading-tight mb-4 drop-shadow-lg max-w-3xl">
                  {slide.title}
                </h1>
                
                <p className="text-lg text-gray-300 max-w-2xl mb-8 leading-relaxed font-medium drop-shadow-md line-clamp-2 md:line-clamp-3">
                  {slide.subtitle || slide.content?.description || 'Откройте для себя новые впечатления от просмотра.'}
                </p>
                
                <div className="flex flex-wrap items-center gap-4">
                  {slide.content?.id && (
                    <Link
                      to={/movie/}
                      className="flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 hover:bg-gray-100 rounded-full font-bold transition-all shadow-xl hover:scale-105"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Смотреть
                    </Link>
                  )}
                  {slide.link_url && !slide.content?.id && (
                    <Link
                      to={slide.link_url}
                      className="px-8 py-3.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full font-bold transition-all shadow-xl hover:scale-105"
                    >
                      Подробнее
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Controls */}
        <div className="absolute bottom-6 md:bottom-12 right-6 md:right-12 z-30 flex items-center gap-4">
          <button
            onClick={goToPrevious}
            className="p-3 rounded-full bg-white/10 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="p-3 rounded-full bg-white/10 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={h-1.5 rounded-full transition-all duration-300 }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default HeroCarousel
'''

# -------------- HOME --------------
home_content = '''import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Play, Star, TrendingUp, Heart, Zap, Globe, Target, Film, Tv, Gamepad2, X, ChevronDown, CheckCircle2 } from 'lucide-react'
import MetascoreBadge from '../components/MetascoreBadge'
import UserScoreBadge from '../components/UserScoreBadge'
import HeroCarousel from '../components/HeroCarousel'
import ContentHoverCard from '../components/ContentHoverCard'
import RecommendedSection from '../components/RecommendedSection'
import { useAuth } from '../context/AuthContext'

const Home = () => {
  const { isAuthenticated } = useAuth()
  const features = [
    {
      icon: Heart,
      title: 'Анализ эмоций',
      description: 'Эмоциональное облако: радость, грусть, напряжение, восторг',
      color: 'text-rose-500',
      bg: 'bg-rose-50'
    },
    {
      icon: Target,
      title: 'Ожидание/Реальность',
      description: 'Сравнение ожиданий с реальностью после просмотра',
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      icon: Globe,
      title: 'Мировые оценки',
      description: 'Сравнение восприятия в разных странах мира',
      color: 'text-indigo-500',
      bg: 'bg-indigo-50'
    }
  ]

  const [movies, setMovies] = useState([])
  const [series, setSeries] = useState([])
  const [games, setGames] = useState([])
  const [comingSoon, setComingSoon] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedRating, setSelectedRating] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const allGenres = useMemo(() => {
    const genres = new Set();
    [...movies, ...series, ...games].forEach(item => { if (item.genre) genres.add(item.genre) })
    return Array.from(genres).sort()
  }, [movies, series, games])

  const allYears = useMemo(() => {
    const years = new Set();
    [...movies, ...series, ...games].forEach(item => { if (item.release_year) years.add(item.release_year) })
    return Array.from(years).sort((a, b) => b - a)
  }, [movies, series, games])

  const processContent = (items) => {
    let processed = items.filter(item => {
      if (selectedGenre && item.genre !== selectedGenre) return false
      if (selectedYear && item.release_year !== parseInt(selectedYear)) return false
      if (selectedRating) {
        const rating = Number(item.avg_rating || 0)
        if (selectedRating === 'high' && rating < 7) return false
        if (selectedRating === 'medium' && (rating < 5 || rating >= 7)) return false
        if (selectedRating === 'low' && rating >= 5) return false
      }
      return true
    })
    return processed.sort((a, b) => {
      if (sortBy === 'newest') return (b.release_year || 0) - (a.release_year || 0)
      if (sortBy === 'old') return (a.release_year || 0) - (b.release_year || 0)
      if (sortBy === 'rating') return (b.avg_rating || 0) - (a.avg_rating || 0)
      return 0
    })
  }

  const filteredMovies = useMemo(() => processContent(movies), [movies, selectedGenre, selectedYear, selectedRating, sortBy])
  const filteredSeries = useMemo(() => processContent(series), [series, selectedGenre, selectedYear, selectedRating, sortBy])
  const filteredGames = useMemo(() => processContent(games), [games, selectedGenre, selectedYear, selectedRating, sortBy])
  const hasActiveFilters = selectedGenre || selectedYear || selectedRating || sortBy !== 'newest'

  const clearFilters = () => {
    setSelectedGenre('')
    setSelectedYear('')
    setSelectedRating('')
    setSortBy('newest')
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [mRes, sRes, gRes, cRes] = await Promise.all([
          axios.get('/api/content', { params: { type: 'MOVIE', limit: 8 } }),
          axios.get('/api/content', { params: { type: 'TV_SERIES', limit: 8 } }),
          axios.get('/api/content', { params: { type: 'GAME', limit: 8 } }),
          axios.get('/api/content/coming-soon/active')
        ])
        if (cancelled) return
        setMovies(Array.isArray(mRes.data) ? mRes.data : [])
        setSeries(Array.isArray(sRes.data) ? sRes.data : [])
        setGames(Array.isArray(gRes.data) ? gRes.data : [])
        setComingSoon(Array.isArray(cRes.data) ? cRes.data : [])
      } catch (e) {
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans">
      <HeroCarousel />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="mb-12">
          <div className="flex flex-wrap items-center gap-3 p-2 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <FilterSelect value={selectedGenre} options={allGenres} defaultLabel="Все жанры" onChange={setSelectedGenre} />
            <FilterSelect value={selectedYear} options={allYears} defaultLabel="Год выпуска" onChange={setSelectedYear} />
            <FilterSelect 
              value={selectedRating} 
              options={[{id: 'high', label: 'Высокий (7+)'}, {id: 'medium', label: 'Средний (5-7)'}, {id: 'low', label: 'Низкий (<5)'}]} 
              defaultLabel="Оценка" 
              onChange={setSelectedRating} 
              isObject={true}
            />
            <div className="w-px h-6 bg-gray-200 mx-2 hidden md:block"></div>
            <FilterSelect 
              value={sortBy} 
              options={[{id: 'newest', label: 'Сначала новые'}, {id: 'old', label: 'Сначала старые'}, {id: 'rating', label: 'Лучшие'}]} 
              defaultLabel="Сортировка" 
              onChange={setSortBy}
              isObject={true}
            />
            
            {hasActiveFilters && (
              <button onClick={clearFilters} className="ml-auto px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-2">
                Сбросить 
              </button>
            )}
          </div>
        </div>

        {isAuthenticated && <RecommendedSection />}

        <div className="space-y-16">
          <ContentSection title="Популярные фильмы" icon={<Film className="text-indigo-600" />} items={filteredMovies} linkTo="/movies" loading={loading} hasFilters={hasActiveFilters} />
          <ContentSection title="Трендовые сериалы" icon={<Tv className="text-indigo-600" />} items={filteredSeries} linkTo="/series" loading={loading} hasFilters={hasActiveFilters} />
          <ContentSection title="Новые игры" icon={<Gamepad2 className="text-indigo-600" />} items={filteredGames} linkTo="/games" loading={loading} hasFilters={hasActiveFilters} />
        </div>

        <section className="mt-24 pt-16 border-t border-gray-200">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Агрегатор нового поколения</h2>
            <p className="text-lg text-gray-500">CineVibe не просто собирает оценки. Мы используем ИИ, анализируем тональность, собираем хайп из сети и помогаем вам найти контент, который откликнется именно вам.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className={w-14 h-14 rounded-2xl   flex items-center justify-center mb-6 group-hover:scale-110 transition-transform}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

const FilterSelect = ({ value, options, defaultLabel, onChange, isObject=false }) => (
  <div className="relative group flex-1 sm:flex-none">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none w-full bg-transparent border-0 px-4 py-2.5 pr-10 text-sm font-semibold text-gray-700 cursor-pointer focus:ring-0 focus:outline-none hover:bg-gray-50 rounded-xl transition-colors"
    >
      <option value="" disabled={!isObject}>{defaultLabel}</option>
      {options.map(opt => (
        <option key={isObject ? opt.id : opt} value={isObject ? opt.id : opt}>{isObject ? opt.label : opt}</option>
      ))}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-indigo-500" />
  </div>
)

const ContentSection = ({ title, icon, items, linkTo, loading, hasFilters }) => (
  <section>
    <div className="flex items-end justify-between mb-8 pb-4 border-b border-gray-200">
      <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg">{icon}</div>
        {title}
      </h2>
      <Link to={linkTo} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full mb-1">
        Смотреть все >
      </Link>
    </div>
    
    {loading ? (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="aspect-[2/3] bg-gray-200 rounded-xl"></div>)}
      </div>
    ) : items.length === 0 && hasFilters ? (
      <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl">
        <Film className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 font-medium">К сожалению, ничего не найдено</p>
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6 lg:gap-8">
        {items.slice(0, 4).map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    )}
  </section>
)

const ContentCard = ({ item }) => {
  const link = item.type === 'series' ? /series/ : item.type === 'game' ? /game/ : /movie/
  
  return (
    <div className="group relative">
      <Link to={link} className="block w-full">
        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-4 bg-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
          <img 
            src={item.poster_url || 'https://placehold.co/400x600/e2e8f0/64748b?text=No+Poster'} 
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-lg px-2 py-1 shadow-sm font-bold text-xs text-gray-900 flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            {Number(item.avg_rating || 0).toFixed(1)}
          </div>
        </div>
        
        <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors mb-1 truncate">
          {item.title}
        </h3>
        
        <div className="flex items-center text-sm font-medium text-gray-500 space-x-2">
          <span>{item.release_year}</span>
          {item.genre && (
            <>
              <span className="text-gray-300">•</span>
              <span className="truncate">{item.genre}</span>
            </>
          )}
        </div>
      </Link>
    </div>
  )
}

export default Home
'''

update_file('movie-aggregator-frontend/src/components/Navbar.jsx', navbar_content)
update_file('movie-aggregator-frontend/src/components/HeroCarousel.jsx', hero_content)
update_file('movie-aggregator-frontend/src/pages/Home.jsx', home_content)

print("UI successfully updated!")
