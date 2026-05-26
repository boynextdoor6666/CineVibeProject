import React from 'react'
import { Link } from 'react-router-dom'
import { Github, Instagram, Mail, Twitter, Youtube } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-[#07080d]">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center">
              <img src="/cinevibe-logo.png" alt="CineVibe" className="h-12 w-auto max-w-[210px] object-contain" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              Агрегатор оценок, рецензий и настроений аудитории для фильмов, сериалов и игр.
            </p>
            <div className="mt-5 flex gap-3">
              {[Github, Twitter, Instagram, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:border-lime-300/40 hover:text-lime-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Разделы" links={[
            ['Главная', '/'],
            ['Фильмы', '/movies'],
            ['Сериалы', '/series'],
            ['Игры', '/games'],
            ['Критики', '/critics']
          ]} />

          <FooterColumn title="Возможности" links={[
            ['Аналитика', '/analytics'],
            ['Мой вкус', '/taste-profile'],
            ['Хайп-мониторинг', '/hype-monitoring'],
            ['Календарь релизов', '/coming-soon']
          ]} />

          <div>
            <h4 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-white">Поддержка</h4>
            <a
              href="mailto:support@cinevibe.com"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-lime-300/40 hover:text-lime-200"
            >
              <Mail className="h-4 w-4" />
              Связаться с нами
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>© 2026 CineVibe. Все права защищены.</span>
          <span>Курсовой проект по агрегированию медиаконтента.</span>
        </div>
      </div>
    </footer>
  )
}

const FooterColumn = ({ title, links }) => (
  <div>
    <h4 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-white">{title}</h4>
    <ul className="space-y-3 text-sm">
      {links.map(([label, path]) => (
        <li key={path}>
          <Link to={path} className="font-semibold text-slate-400 transition hover:text-lime-200">
            {label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

export default Footer
