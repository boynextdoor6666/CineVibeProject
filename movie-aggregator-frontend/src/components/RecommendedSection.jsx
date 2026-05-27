import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Sparkles } from 'lucide-react'
import PosterFrame from './PosterFrame'
import { useAuth } from '../context/AuthContext'

const RecommendedSection = () => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    const fetchRecommendations = async () => {
      try {
        const response = await axios.get('/api/recommendations')
        setRecommendations(response.data)
      } catch (error) {
        console.error('Failed to fetch recommendations', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [isAuthenticated])

  if (loading || recommendations.length === 0) return null

  return (
    <section className="mb-16 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-50 p-3 ring-1 ring-indigo-100">
            <Sparkles className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-100">Рекомендовано для вас</h2>
            <p className="text-sm text-slate-400">Подборка на основе ваших оценок и истории просмотров</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {recommendations.filter((rec) => rec.content).slice(0, 5).map((rec) => {
          const item = rec.content
          const linkPath = item?.type === 'movie'
            ? `/movie/${item.id}`
            : item?.type === 'series'
              ? `/series/${item.id}`
              : `/game/${item.id}`

          return (
            <Link key={rec.id} to={linkPath} className="group block">
              <PosterFrame
                src={item.poster_url}
                alt={item.title}
                title={item.title}
                type={item.type}
                className="aspect-[2/3] shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
                badge={(
                  <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-indigo-300 shadow-sm ring-1 ring-white/10 backdrop-blur">
                    {Math.round(rec.score * 100)}% match
                  </span>
                )}
              />

              <div className="mt-3 space-y-1">
                <h3 className="truncate font-semibold text-slate-100 transition-colors group-hover:text-indigo-400">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>{item.release_year}</span>
                  <span>•</span>
                  <span className="capitalize">{item.type}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default RecommendedSection
