import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calendar, Film, Flame, Gamepad2, Globe, Heart, LayoutDashboard, Sparkles, Star, Tv, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  const navItems = [
    ...(isAuthenticated && user?.role === 'ADMIN' ? [{ path: '/dashboard', label: 'Дашборд', icon: LayoutDashboard }] : []),
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

  const isActivePath = (path) => location.pathname === path

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#090b12] md:flex">
      <div className="space-y-7 p-4">
        <SidebarSection title="Контент" items={contentItems} isActivePath={isActivePath} />
        <SidebarSection title="Навигация" items={navItems} isActivePath={isActivePath} />
      </div>
    </aside>
  )
}

const SidebarSection = ({ title, items, isActivePath }) => (
  <div>
    <h3 className="mb-2 px-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</h3>
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon
        const active = isActivePath(item.path)
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
              active
                ? 'bg-lime-300 text-slate-950 shadow-lg shadow-lime-300/10'
                : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </div>
  </div>
)

export default Sidebar
