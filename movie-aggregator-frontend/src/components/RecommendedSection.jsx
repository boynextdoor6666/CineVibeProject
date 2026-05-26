import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Sparkles } from 'lucide-react'
import ContentHoverCard from './ContentHoverCard'
import MetascoreBadge from './MetascoreBadge'
import UserScoreBadge from './UserScoreBadge'
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
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 ring-1 ring-indigo-100 rounded-lg">
            <Sparkles className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Рекомендовано для вас</h2>
            <p className="text-sm text-gray-500">На основе ваших оценок и предпочтений</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {recommendations.filter(rec => rec.content).slice(0, 5).map((rec) => {
          const item = rec.content
          const linkPath = item?.type === 'movie' ? `/movie/${item.id}` 
            : item?.type === 'series' ? `/series/${item.id}` 
            : `/game/${item.id}`

          return (
            <div key={rec.id} className="group relative">
              <Link to={linkPath} className="block w-full">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Баджи перенесены так, чтобы выглядели чище */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-white/90 backdrop-blur text-xs font-semibold text-indigo-700 shadow-sm">
                      {Math.round(rec.score * 100)}% Match
                    </span>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                  {item.title}
                </h3>
                <div className="flex items-center text-sm text-gray-500 mt-1 space-x-2">
                  <span>{item.release_year}</span>
                  <span>•</span>
                  <span className="capitalize">{item.type}</span>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default RecommendedSection
