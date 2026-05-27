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
    <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-48 shrink-0 flex-col gap-3 overflow-y-auto rounded-3xl border border-slate-800 bg-[#0d1222]/92 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur lg:flex">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-3 text-white shadow-lg shadow-black/20 border border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-500/30">
            <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[9px] font-bold uppercase tracking-[0.22em] text-white/50">CineVibe</p>
            <h2 className="truncate text-sm font-black tracking-tight text-white/90">Навигация</h2>
          </div>
        </div>
      </div>

      <div className="space-y-5 rounded-2xl border border-white/5 bg-white/[0.02] p-2.5 shadow-sm">
        <SidebarSection title="Контент" items={contentItems} isActivePath={isActivePath} />
        <SidebarSection title="Навигация" items={navItems} isActivePath={isActivePath} />
      </div>
    </aside>
  )
}

const SidebarSection = ({ title, items, isActivePath }) => (
  <div>
    <h3 className="mb-2.5 px-2 text-[9px] font-black uppercase tracking-[0.24em] text-slate-500">{title}</h3>
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon
        const active = isActivePath(item.path)
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
              active
                ? 'bg-indigo-600 border border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-indigo-200' : 'text-slate-500'}`} />
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </div>
  </div>
)

export default Sidebar
