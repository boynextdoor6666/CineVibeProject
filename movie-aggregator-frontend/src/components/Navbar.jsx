import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Film,
  Flame,
  Gamepad2,
  Globe,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Search,
  Shield,
  Sparkles,
  Star,
  Tv,
  User,
  X,
  Zap
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/critics', label: 'Критики', icon: Star },
  { path: '/analytics', label: 'Аналитика', icon: Globe },
  { path: '/world-ratings', label: 'Мир оценок', icon: Zap },
  { path: '/taste-profile', label: 'Мой вкус', icon: Heart },
  { path: '/hype-monitoring', label: 'Хайп', icon: Flame },
  { path: '/coming-soon', label: 'Скоро выйдет', icon: Calendar }
]

const contentItems = [
  { path: '/', label: 'Главная', icon: Sparkles },
  { path: '/movies', label: 'Фильмы', icon: Film },
  { path: '/series', label: 'Сериалы', icon: Tv },
  { path: '/games', label: 'Игры', icon: Gamepad2 }
]

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
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        setShowSuggestions(false)
        return
      }

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
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  const isActivePath = (path) => location.pathname === path

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleSelectContent = (contentId) => {
    setSearchQuery('')
    setShowSuggestions(false)
    setSearchResults([])
    navigate(`/content/${contentId}`)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#07080d]/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex shrink-0 items-center">
            <img
              src="/cinevibe-logo.png"
              alt="CineVibe"
              className="h-11 w-auto max-w-[178px] object-contain transition hover:scale-[1.03] md:max-w-[210px]"
            />
          </Link>

          <div className="hidden flex-1 md:flex" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative mx-auto w-full max-w-xl">
              <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск фильмов, сериалов, игр..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] py-2.5 pl-11 pr-4 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-lime-300/70 focus:ring-4 focus:ring-lime-300/10"
              />

              {showSuggestions && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/60">
                  {isSearching ? (
                    <div className="px-4 py-5 text-center text-sm text-slate-400">Ищем...</div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelectContent(result.id)}
                          className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition last:border-0 hover:bg-white/[0.06]"
                        >
                          {result.poster_url ? (
                            <img src={result.poster_url} alt={result.title} className="h-14 w-10 rounded object-cover" />
                          ) : (
                            <div className="flex h-14 w-10 items-center justify-center rounded bg-white/10">
                              <Film className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold text-white">{result.title}</div>
                            <div className="mt-1 text-xs text-slate-500">{result.release_year || 'Год неизвестен'}</div>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={handleSearchSubmit}
                        className="w-full px-4 py-3 text-center text-sm font-bold text-lime-200 transition hover:bg-white/[0.06]"
                      >
                        Показать все результаты для "{searchQuery}"
                      </button>
                    </>
                  ) : (
                    <div className="px-4 py-5 text-center text-sm text-slate-400">Ничего не найдено</div>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <>
                {user?.role === 'ADMIN' && (
                  <NavButton to="/admin" active={isActivePath('/admin')} icon={Shield} label="Админ" />
                )}
                <NavButton to="/profile" active={isActivePath('/profile')} icon={User} label={user?.username || 'Профиль'} />
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Выход
                </button>
              </>
            ) : (
              <>
                <NavButton to="/login" active={isActivePath('/login')} icon={LogIn} label="Вход" />
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-lime-200"
                >
                  <User className="h-4 w-4" />
                  Регистрация
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen((value) => !value)}
            className="rounded-xl p-2 text-slate-200 transition hover:bg-white/[0.07] md:hidden"
            aria-label="Открыть меню"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-white/10 py-4 md:hidden">
            <form onSubmit={handleSearchSubmit} className="relative mb-4">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] py-2.5 pl-11 pr-4 text-white outline-none"
              />
            </form>
            <MobileMenuSection title="Контент" items={contentItems} isActivePath={isActivePath} onClose={() => setIsMenuOpen(false)} />
            <MobileMenuSection title="Навигация" items={navItems} isActivePath={isActivePath} onClose={() => setIsMenuOpen(false)} />
          </div>
        )}
      </div>
    </nav>
  )
}

const NavButton = ({ to, active, icon: Icon, label }) => (
  <Link
    to={to}
    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
      active ? 'bg-lime-300 text-slate-950' : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
    }`}
  >
    <Icon className="h-4 w-4" />
    {label}
  </Link>
)

const MobileMenuSection = ({ title, items, isActivePath, onClose }) => (
  <div className="mb-3">
    <div className="px-2 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</div>
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon
        const active = isActivePath(item.path)
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 font-bold transition ${
              active ? 'bg-lime-300 text-slate-950' : 'text-slate-300 hover:bg-white/[0.07]'
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </div>
  </div>
)

export default Navbar
