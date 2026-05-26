import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Clapperboard,
  Film,
  Gamepad2,
  Globe,
  Heart,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Tv,
  Users,
  X,
  Zap
} from 'lucide-react'
import MetascoreBadge from '../components/MetascoreBadge'
import ContentHoverCard from '../components/ContentHoverCard'
import RecommendedSection from '../components/RecommendedSection'
import { useAuth } from '../context/AuthContext'

const typeMeta = {
  MOVIE: { label: 'Фильм', path: 'movie' },
  TV_SERIES: { label: 'Сериал', path: 'series' },
  GAME: { label: 'Игра', path: 'game' }
}

const features = [
  {
    icon: Heart,
    title: 'Эмоциональная аналитика',
    description: 'CineVibe показывает не только оценку, но и настроение отзывов: восторг, напряжение, грусть и спорные реакции.',
    accent: 'text-rose-300 bg-rose-400/10 border-rose-300/20'
  },
  {
    icon: Target,
    title: 'Ожидания против реальности',
    description: 'Сравнивайте хайп до релиза с реальными оценками после просмотра и находите переоцененные премьеры.',
    accent: 'text-lime-300 bg-lime-400/10 border-lime-300/20'
  },
  {
    icon: Users,
    title: 'Критики и зрители рядом',
    description: 'Сводите в одной ленте профессиональные рецензии, пользовательские оценки и личные рекомендации.',
    accent: 'text-cyan-300 bg-cyan-400/10 border-cyan-300/20'
  },
  {
    icon: Globe,
    title: 'Мировая карта оценок',
    description: 'Следите, как фильмы, сериалы и игры воспринимаются в разных странах и аудиториях.',
    accent: 'text-indigo-200 bg-indigo-300/10 border-indigo-200/20'
  }
]

const Home = () => {
  const { isAuthenticated } = useAuth()
  const [movies, setMovies] = useState([])
  const [series, setSeries] = useState([])
  const [games, setGames] = useState([])
  const [comingSoon, setComingSoon] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedRating, setSelectedRating] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const allContent = useMemo(() => [...movies, ...series, ...games], [movies, series, games])

  const allGenres = useMemo(() => {
    const genres = new Set()
    allContent.forEach((item) => item.genre && genres.add(item.genre))
    return Array.from(genres).sort()
  }, [allContent])

  const allYears = useMemo(() => {
    const years = new Set()
    allContent.forEach((item) => item.release_year && years.add(item.release_year))
    return Array.from(years).sort((a, b) => b - a)
  }, [allContent])

  const processContent = (items) => {
    const processed = items.filter((item) => {
      if (selectedGenre && item.genre !== selectedGenre) return false
      if (selectedYear && item.release_year !== Number(selectedYear)) return false
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
  const filteredAll = useMemo(() => processContent(allContent), [allContent, selectedGenre, selectedYear, selectedRating, sortBy])

  const spotlight = filteredAll[0] || allContent[0]
  const topRated = useMemo(
    () => [...allContent].sort((a, b) => Number(b.avg_rating || 0) - Number(a.avg_rating || 0)).slice(0, 5),
    [allContent]
  )
  const hasActiveFilters = Boolean(selectedGenre || selectedYear || selectedRating || sortBy !== 'newest')

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
      setError(null)
      try {
        const [mRes, sRes, gRes, cRes] = await Promise.all([
          axios.get('/api/content', { params: { type: 'MOVIE', limit: 12 } }),
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
        if (!cancelled) setError('Не удалось загрузить контент. Проверьте подключение к серверу.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden rounded-[2rem] bg-[#080b14] text-slate-100 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(132,204,22,0.18),transparent_28%),radial-gradient(circle_at_90%_0%,rgba(56,189,248,0.16),transparent_30%),linear-gradient(180deg,#111827_0%,#080b14_44%,#07080d_100%)]" />

      <section className="relative z-10 grid min-h-[560px] gap-8 px-5 py-8 md:px-8 lg:grid-cols-[1.45fr_0.9fr] lg:px-10">
        <div className="flex flex-col justify-between gap-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-sm font-semibold text-lime-200">
              <Sparkles className="h-4 w-4" />
              Новый взгляд на кино, сериалы и игры
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-normal text-white md:text-6xl">
              Выбирайте контент по настроению, оценкам и реальному хайпу.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              Главная страница теперь работает как кинопульт: быстрый обзор трендов, фильтры, рейтинги и ближайшие релизы собраны в одном сценарии.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard value={allContent.length || '...'} label="объектов в витрине" icon={Clapperboard} />
            <MetricCard value={comingSoon.length || '...'} label="релизов скоро" icon={CalendarDays} />
            <MetricCard value={topRated[0]?.avg_rating ? Number(topRated[0].avg_rating).toFixed(1) : '...'} label="лучший рейтинг" icon={Star} />
          </div>
        </div>

        <SpotlightCard item={spotlight} loading={loading} />
      </section>

      <section className="relative z-10 px-5 pb-8 md:px-8 lg:px-10">
        <FilterPanel
          allGenres={allGenres}
          allYears={allYears}
          selectedGenre={selectedGenre}
          selectedYear={selectedYear}
          selectedRating={selectedRating}
          sortBy={sortBy}
          hasActiveFilters={hasActiveFilters}
          onGenreChange={setSelectedGenre}
          onYearChange={setSelectedYear}
          onRatingChange={setSelectedRating}
          onSortChange={setSortBy}
          onClear={clearFilters}
        />
      </section>

      <main className="relative z-10 space-y-12 px-5 pb-14 md:px-8 lg:px-10">
        {error && (
          <div className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-5 py-4 text-sm font-medium text-rose-100">
            {error}
          </div>
        )}

        {isAuthenticated && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5">
            <RecommendedSection />
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
          <div className="space-y-12">
            <ContentRail
              title="Фильмы в фокусе"
              subtitle="Самые заметные позиции витрины"
              icon={Film}
              items={filteredMovies}
              total={movies.length}
              link="/movies"
              linkText="Все фильмы"
              type="movie"
              loading={loading}
              hasActiveFilters={hasActiveFilters}
            />

            <div className="grid gap-8 lg:grid-cols-2">
              <CompactRail
                title="Сериалы недели"
                icon={Tv}
                items={filteredSeries.slice(0, 4)}
                total={series.length}
                link="/series"
                emptyText="Сериалов под такие фильтры нет"
                type="series"
                loading={loading}
              />
              <CompactRail
                title="Игры для вечера"
                icon={Gamepad2}
                items={filteredGames.slice(0, 4)}
                total={games.length}
                link="/games"
                emptyText="Игр под такие фильтры нет"
                type="game"
                loading={loading}
              />
            </div>

            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
              <SectionHeader
                title="Почему CineVibe"
                subtitle="Сервис смотрит шире обычной средней оценки"
                icon={Activity}
              />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {features.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <article key={feature.title} className="rounded-xl border border-white/10 bg-slate-950/45 p-5 transition hover:-translate-y-1 hover:border-lime-300/30">
                      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${feature.accent}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
                    </article>
                  )
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <TopRatedPanel items={topRated} />
            <ComingSoonPanel items={comingSoon} />
            <HypePanel />
          </aside>
        </div>
      </main>
    </div>
  )
}

const MetricCard = ({ value, label, icon: Icon }) => (
  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
    <Icon className="mb-3 h-5 w-5 text-lime-300" />
    <div className="text-2xl font-black text-white">{value}</div>
    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
  </div>
)

const SpotlightCard = ({ item, loading }) => {
  const contentType = typeMeta[item?.content_type] || typeMeta.MOVIE
  const link = item ? `/${contentType.path}/${item.id}` : '/movies'

  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
      {item?.poster_url ? (
        <img src={item.poster_url} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#1f2937,#0f172a_55%,#365314)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-[#080b14]/68 to-transparent" />

      <div className="relative flex h-full min-h-[520px] flex-col justify-end p-6 md:p-8">
        <div className="mb-auto flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
            <Zap className="h-3.5 w-3.5 text-lime-300" />
            Спотлайт
          </span>
          {item && <MetascoreBadge score={Number(item.critics_rating || item.avg_rating || 0) * 10} size="small" />}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-300">
            <span>{contentType.label}</span>
            {item?.release_year && <span>{item.release_year}</span>}
            {item?.genre && <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{item.genre}</span>}
          </div>
          <h2 className="text-3xl font-black leading-tight text-white md:text-4xl">
            {loading ? 'Загружаем подборку...' : item?.title || 'Контент появится здесь'}
          </h2>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
            {item?.description || 'После загрузки данных здесь появится главный материал витрины с рейтингом, жанром и быстрым переходом.'}
          </p>
          <Link
            to={link}
            className="mt-6 inline-flex items-center gap-3 rounded-xl bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
          >
            <Play className="h-4 w-4 fill-current" />
            Открыть карточку
          </Link>
        </div>
      </div>
    </div>
  )
}

const FilterPanel = ({
  allGenres,
  allYears,
  selectedGenre,
  selectedYear,
  selectedRating,
  sortBy,
  hasActiveFilters,
  onGenreChange,
  onYearChange,
  onRatingChange,
  onSortChange,
  onClear
}) => (
  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20 backdrop-blur">
    <div className="mb-4 flex items-center gap-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
      <SlidersHorizontal className="h-4 w-4 text-lime-300" />
      Настроить витрину
    </div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_0.8fr_0.9fr_1fr_auto]">
      <SelectField icon={Search} value={selectedGenre} onChange={onGenreChange} label="Все жанры">
        {allGenres.map((genre) => (
          <option key={genre} value={genre}>{genre}</option>
        ))}
      </SelectField>
      <SelectField value={selectedYear} onChange={onYearChange} label="Любой год">
        {allYears.map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </SelectField>
      <SelectField value={selectedRating} onChange={onRatingChange} label="Любой рейтинг">
        <option value="high">Высокий: 7+</option>
        <option value="medium">Средний: 5-7</option>
        <option value="low">Низкий: до 5</option>
      </SelectField>
      <SelectField icon={TrendingUp} value={sortBy} onChange={onSortChange} label="Сначала новые">
        <option value="newest">Сначала новые</option>
        <option value="old">Сначала старые</option>
        <option value="rating">По рейтингу</option>
      </SelectField>
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100 transition hover:bg-rose-400/20"
        >
          <X className="h-4 w-4" />
          Сбросить
        </button>
      )}
    </div>
  </div>
)

const SelectField = ({ value, onChange, label, children, icon: Icon = ChevronDown }) => (
  <label className="relative block">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-full w-full appearance-none rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 pr-11 text-sm font-semibold text-white outline-none transition hover:border-lime-300/30 focus:border-lime-300/70 focus:ring-4 focus:ring-lime-300/10"
    >
      <option value="">{label}</option>
      {children}
    </select>
    <Icon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-lime-300" />
  </label>
)

const SectionHeader = ({ title, subtitle, icon: Icon, link, linkText }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-300 text-slate-950">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
    {link && (
      <Link to={link} className="inline-flex items-center gap-2 text-sm font-bold text-lime-200 transition hover:text-white">
        {linkText}
        <ArrowRight className="h-4 w-4" />
      </Link>
    )}
  </div>
)

const ContentRail = ({ title, subtitle, icon, items, total, link, linkText, type, loading, hasActiveFilters }) => (
  <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
    <SectionHeader
      title={title}
      subtitle={hasActiveFilters ? `${items.length} из ${total} по выбранным фильтрам` : subtitle}
      icon={icon}
      link={link}
      linkText={linkText}
    />
    {loading ? (
      <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="aspect-[2/3] animate-pulse rounded-xl bg-white/10" />
        ))}
      </div>
    ) : items.length === 0 ? (
      <EmptyState icon={icon} text="Под выбранные фильтры ничего не найдено" />
    ) : (
      <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {items.slice(0, 8).map((item) => (
          <ContentCard key={`${type}-${item.id}`} item={item} type={type} />
        ))}
      </div>
    )}
  </section>
)

const CompactRail = ({ title, icon: Icon, items, link, emptyText, type, loading }) => (
  <section className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-lime-300" />
        <h2 className="text-xl font-black text-white">{title}</h2>
      </div>
      <Link to={link} className="text-sm font-bold text-slate-400 transition hover:text-lime-200">Все</Link>
    </div>
    {loading ? (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl bg-white/10" />
        ))}
      </div>
    ) : items.length === 0 ? (
      <EmptyState icon={Icon} text={emptyText} compact />
    ) : (
      <div className="space-y-3">
        {items.map((item) => (
          <MiniContentRow key={`${type}-${item.id}`} item={item} type={type} />
        ))}
      </div>
    )}
  </section>
)

const ContentCard = ({ item, type }) => {
  const link = type === 'series' ? `/series/${item.id}` : type === 'game' ? `/game/${item.id}` : `/movie/${item.id}`

  return (
    <ContentHoverCard item={item}>
      <Link to={link} className="group block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-900 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-lime-300/40">
          <img
            src={item.poster_url || 'https://placehold.co/300x450/111827/e2e8f0?text=CineVibe'}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
          <div className="absolute left-3 top-3">
            <MetascoreBadge score={Number(item.critics_rating || item.avg_rating || 0) * 10} size="small" />
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="line-clamp-2 text-base font-black leading-tight text-white">{item.title}</h3>
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span>{item.release_year || 'N/A'}</span>
              {item.genre && <span className="truncate">{item.genre}</span>}
            </div>
          </div>
        </div>
      </Link>
    </ContentHoverCard>
  )
}

const MiniContentRow = ({ item, type }) => {
  const link = type === 'series' ? `/series/${item.id}` : type === 'game' ? `/game/${item.id}` : `/movie/${item.id}`

  return (
    <Link to={link} className="group flex gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-lime-300/30 hover:bg-white/[0.07]">
      <img
        src={item.poster_url || 'https://placehold.co/96x128/111827/e2e8f0?text=CV'}
        alt={item.title}
        className="h-20 w-14 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white group-hover:text-lime-200">{item.title}</h3>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <Star className="h-3.5 w-3.5 text-lime-300" />
          <span>{Number(item.avg_rating || 0).toFixed(1)}</span>
          <span>{item.release_year}</span>
        </div>
      </div>
    </Link>
  )
}

const TopRatedPanel = ({ items }) => (
  <section className="rounded-2xl border border-white/10 bg-slate-950/65 p-5">
    <div className="mb-4 flex items-center gap-2">
      <Star className="h-5 w-5 text-lime-300" />
      <h2 className="text-lg font-black text-white">Топ рейтинга</h2>
    </div>
    <div className="space-y-2">
      {items.length === 0 ? (
        <EmptyState icon={Star} text="Рейтинг появится после загрузки" compact />
      ) : (
        items.map((item, index) => {
          const meta = typeMeta[item.content_type] || typeMeta.MOVIE
          return (
            <Link key={item.id} to={`/${meta.path}/${item.id}`} className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.06]">
              <span className="w-7 text-center text-lg font-black text-slate-600 group-hover:text-lime-300">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-500">{meta.label} · {item.release_year || 'N/A'}</p>
              </div>
              <span className="rounded-lg bg-lime-300/10 px-2 py-1 text-xs font-black text-lime-200">
                {Number(item.avg_rating || 0).toFixed(1)}
              </span>
            </Link>
          )
        })
      )}
    </div>
  </section>
)

const ComingSoonPanel = ({ items }) => (
  <section className="rounded-2xl border border-white/10 bg-slate-950/65 p-5">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-cyan-300" />
        <h2 className="text-lg font-black text-white">Скоро выйдет</h2>
      </div>
      <Link to="/coming-soon" className="text-xs font-bold text-slate-400 hover:text-cyan-200">Календарь</Link>
    </div>
    <div className="space-y-3">
      {items.length === 0 ? (
        <EmptyState icon={CalendarDays} text="Ожидаемых релизов нет" compact />
      ) : (
        items.slice(0, 4).map((item) => (
          <Link key={item.id} to="/coming-soon" className="group flex gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-cyan-300/30">
            <img src={item.poster_url} alt={item.title} className="h-20 w-14 rounded-lg object-cover" />
            <div>
              <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white group-hover:text-cyan-200">{item.title}</h3>
              <p className="mt-2 text-xs text-slate-400">
                {item.release_date ? new Date(item.release_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : 'Дата уточняется'}
              </p>
            </div>
          </Link>
        ))
      )}
    </div>
  </section>
)

const HypePanel = () => (
  <section className="overflow-hidden rounded-2xl border border-lime-300/20 bg-lime-300 p-5 text-slate-950">
    <Zap className="mb-8 h-8 w-8" />
    <h2 className="text-2xl font-black leading-tight">Что обсуждают прямо сейчас?</h2>
    <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">
      Откройте хайп-мониторинг и проверьте, какие релизы набирают шум в аудитории.
    </p>
    <Link to="/hype-monitoring" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800">
      Смотреть тренды
      <ArrowRight className="h-4 w-4" />
    </Link>
  </section>
)

const EmptyState = ({ icon: Icon, text, compact = false }) => (
  <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.025] text-center text-slate-500 ${compact ? 'min-h-[120px] p-4 text-sm' : 'mt-6 min-h-[220px] p-8'}`}>
    <Icon className="mb-3 h-8 w-8" />
    <p>{text}</p>
  </div>
)

export default Home
