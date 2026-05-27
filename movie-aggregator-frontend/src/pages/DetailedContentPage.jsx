import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Star, Share2, Bookmark, ThumbsUp, ThumbsDown } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PosterFrame from '../components/PosterFrame';
import MetascoreBadge from '../components/MetascoreBadge';
import UserScoreBadge from '../components/UserScoreBadge';
import ReviewDistribution from '../components/ReviewDistribution';
import CriticReviewCard from '../components/CriticReviewCard';
import ExpectationsWidget from '../components/ExpectationsWidget';

const DetailedContentPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [showAllCriticReviews, setShowAllCriticReviews] = useState(false);
  const [userReviewSort, setUserReviewSort] = useState('helpful');

  const [content, setContent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const [reviewForm, setReviewForm] = useState({ rating: 10, content: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const formatErrorMessage = (value, fallback = '??????????? ??????') => {
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'string') return value
    if (value && typeof value === 'object') {
      if (typeof value.message === 'string') return value.message
      if (Array.isArray(value.message)) return value.message.join(', ')
      if (typeof value.error === 'string') return value.error
      try {
        return JSON.stringify(value)
      } catch (_) {
        return fallback
      }
    }
    return fallback
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentRes, reviewsRes] = await Promise.all([
          axios.get(`/api/content/${id}`),
          axios.get(`/api/reviews/content/${id}`)
        ])
        setContent(contentRes.data)
        setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : [])
      } catch (error) {
        console.error('Failed to fetch content:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  useEffect(() => {
    if (!user) return
    const checkWatchlist = async () => {
      try {
        const res = await axios.get('/api/users/me/watchlist')
        const found = Array.isArray(res.data) && res.data.some(item => (item.content_id || item.id) === Number(id))
        setIsInWatchlist(found)
      } catch (error) {
        console.error('Failed to check watchlist:', error)
      }
    }
    checkWatchlist()
  }, [user, id])

  const handleToggleWatchlist = async () => {
    if (!user) return alert('???????, ????? ???????? ? ??????')
    setWatchlistLoading(true)
    try {
      if (isInWatchlist) {
        await axios.delete(`/api/users/me/watchlist/${id}`)
      } else {
        await axios.post(`/api/users/me/watchlist/${id}`)
      }
      setIsInWatchlist(!isInWatchlist)
    } catch (error) {
      alert('?????? ?????????? ??????: ' + formatErrorMessage(error.response?.data, error.message))
    } finally {
      setWatchlistLoading(false)
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user) return alert('???????, ????? ???????? ?????')
    if (!reviewForm.content.trim()) return alert('??????? ????? ??????')

    setReviewSubmitting(true)
    try {
      await axios.post('/api/reviews', {
        content_id: Number(id),
        rating: Number(reviewForm.rating),
        content: reviewForm.content.trim()
      })
      setReviewForm({ rating: 10, content: '' })
      const res = await axios.get(`/api/reviews/content/${id}`)
      setReviews(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      alert('?????? ?????????? ??????: ' + formatErrorMessage(error.response?.data, error.message))
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleVoteReview = async (reviewId, type) => {
    if (!user) return alert('???????, ????? ??????????')
    try {
      await axios.post(`/api/reviews/${reviewId}/vote`, { type })
      const res = await axios.get(`/api/reviews/content/${id}`)
      setReviews(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      alert('?????? ???????????: ' + formatErrorMessage(error.response?.data, error.message))
    }
  }

  const handleShareReview = (reviewId) => {
    if (!reviewId) return
    const url = `${window.location.origin}/content/${id}#review-${reviewId}`
    navigator.clipboard.writeText(url).then(() => {
      alert('?????? ?? ????? ??????????? ? ????? ??????!')
    }).catch(() => {
      alert('?? ??????? ??????????? ??????')
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const contentData = useMemo(() => {
    if (!content) return null

    const criticReviewsList = reviews
      .filter((r) => r.user?.role === 'CRITIC' || r.role === 'CRITIC')
      .map((r) => ({
        id: r.id,
        publicationName: 'Critic',
        publicationLogo: 'https://placehold.co/80x30?text=Critic',
        criticName: r.username || r.user?.username || 'Unknown',
        score: Number(r.rating || 0) * 10,
        excerpt: r.text || r.content,
        fullReviewUrl: '#',
        publishDate: r.created_at,
        type: Number(r.rating || 0) >= 7 ? 'positive' : Number(r.rating || 0) >= 4 ? 'mixed' : 'negative'
      }))

    const userReviewsList = reviews
      .filter((r) => r.user?.role !== 'CRITIC' && r.role !== 'CRITIC')
      .map((r) => ({
        id: r.id,
        userName: r.username || r.user?.username || 'User',
        userAvatar: r.avatar_url || r.user?.avatar_url || 'https://placehold.co/50',
        score: Number(r.rating || 0),
        title: r.title || 'Review',
        content: r.text || r.content,
        helpful: Number(r.likes || 0),
        notHelpful: Number(r.dislikes || 0),
        date: r.created_at,
        type: Number(r.rating || 0) >= 7 ? 'positive' : Number(r.rating || 0) >= 4 ? 'neutral' : 'negative'
      }))

    return {
      id: content.id,
      title: content.title,
      type: content.content_type?.toLowerCase() || 'movie',
      year: content.release_year,
      poster: content.poster_url || content.cover_url || null,
      trailerUrl: content.trailer_url,
      metascore: content.critics_rating ? Math.round(content.critics_rating * 10) : 0,
      userScore: content.audience_rating || 0,
      developer: content.developer || '',
      publisher: content.publisher || '',
      platforms: content.platforms || [],
      genre: content.genre ? [content.genre] : [],
      esrbRating: content.esrb_rating || '',
      description: content.description || '',
      criticReviews: {
        total: reviews.filter(r => r.user?.role === 'CRITIC').length,
        positive: content.positive_reviews || 0,
        mixed: content.mixed_reviews || 0,
        negative: content.negative_reviews || 0
      },
      userReviews: {
        total: reviews.filter(r => r.user?.role !== 'CRITIC').length,
        positive: 0,
        mixed: 0,
        negative: 0
      },
      criticReviewsList,
      userReviewsList,
      similarContent: []
    }
  }, [content, reviews])

  const reviewDistribution = useMemo(() => {
    const stats = { positive: 0, mixed: 0, negative: 0 }
    reviews.forEach((review) => {
      const rating = Number(review.rating || 0)
      if (rating >= 7) stats.positive += 1
      else if (rating <= 4 && rating > 0) stats.negative += 1
      else stats.mixed += 1
    })
    return stats
  }, [reviews])

  const sortedUserReviews = useMemo(() => {
    if (!contentData) return []
    const items = [...contentData.userReviewsList]
    switch (userReviewSort) {
      case 'highest':
        return items.sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
      case 'lowest':
        return items.sort((a, b) => Number(a.score || 0) - Number(b.score || 0))
      case 'recent':
        return items.sort((a, b) => new Date(b.date) - new Date(a.date))
      case 'helpful':
      default:
        return items.sort((a, b) => Number(b.helpful || 0) - Number(a.helpful || 0))
    }
  }, [contentData, userReviewSort])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">????????...</div>
  if (!contentData) return <div className="min-h-screen flex items-center justify-center text-slate-500">??????? ?? ??????</div>

  const detailRows = [
    ['???', contentData.year || '?'],
    ['?????', contentData.genre.join(', ') || '?'],
    ['???', contentData.type],
    ['???????', contentData.userScore || '?']
  ]

  return (
    <div className="space-y-10 pb-16">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <PosterFrame
            src={contentData.poster}
            alt={contentData.title}
            title={contentData.title}
            type={contentData.type}
            className="aspect-[2/3] shadow-lg"
          />

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300 ring-1 ring-indigo-100">
                {contentData.type === 'movie' ? '?????' : contentData.type === 'series' ? '??????' : contentData.type === 'game' ? '????' : '???????'}
              </span>
              {contentData.year && <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">{contentData.year}</span>}
              {contentData.genre?.[0] && <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">{contentData.genre.join(', ')}</span>}
            </div>

            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-100 sm:text-5xl">{contentData.title}</h1>
              <p className="mt-2 text-slate-500">?????? ? ??????????? ????? ???????? ? ????????</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <MetascoreBadge score={contentData.metascore} size="large" />
              <UserScoreBadge score={contentData.userScore} reviewCount={contentData.userReviews.total} size="large" />
            </div>

            <p className="max-w-3xl text-base leading-7 text-slate-400">
              {contentData.description || '???????? ????? ????????? ?????.'}
            </p>

            <div className="flex flex-wrap gap-3">
              {contentData.trailerUrl ? (
                <a
                  href={contentData.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                >
                  <Play className="w-4 h-4" />
                  ???????? ???????
                </a>
              ) : null}

              <button
                onClick={handleToggleWatchlist}
                disabled={watchlistLoading}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${isInWatchlist ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                <Bookmark className={`w-4 h-4 ${isInWatchlist ? 'fill-white' : ''}`} />
                {isInWatchlist ? '? ??????' : '? ??????'}
              </button>

              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-300"
              >
                <Share2 className="w-4 h-4" />
                ??????????
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-800 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">??????????</div>
                <div className="mt-2 text-2xl font-black text-slate-100">{contentData.criticReviews.total + contentData.userReviews.total}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-800 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">???????</div>
                <div className="mt-2 text-2xl font-black text-slate-100">{contentData.criticReviews.total}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-800 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">????????????</div>
                <div className="mt-2 text-2xl font-black text-slate-100">{contentData.userReviews.total}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-8">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-2 shadow-sm">
            {[
              ['overview', '?????'],
              ['reviews', `?????? (${contentData.criticReviews.total + contentData.userReviews.total})`],
              ['details', '??????']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-100">????????</h2>
                  <button onClick={() => setActiveTab('reviews')} className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                    ??????? ? ??????? ?
                  </button>
                </div>
                <p className="mt-4 whitespace-pre-line leading-7 text-slate-400">{contentData.description || '???????? ????? ????????? ?????.'}</p>
              </section>

              {contentData.criticReviewsList.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-100">???????? ????????</h2>
                    <button onClick={() => setActiveTab('reviews')} className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                      ??? ???????? ?
                    </button>
                  </div>
                  <div className="space-y-4">
                    {contentData.criticReviewsList.slice(0, 3).map((review) => (
                      <CriticReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-100">???????? ?????</h2>
                  <span className="text-sm text-slate-500">?????????? ????????????</span>
                </div>

                <form onSubmit={handleReviewSubmit} className="mt-6 space-y-5">
                  <div className="grid gap-5 md:grid-cols-[1fr_180px]">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">?????????</label>
                      <input
                        value={reviewForm.title || ''}
                        onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="??????? ? ????? ??????"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">??????</label>
                      <div className="rounded-2xl border border-slate-800 bg-slate-800 px-4 py-3">
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>1</span>
                          <span className="font-bold text-indigo-400">{reviewForm.rating || 0}/10</span>
                          <span>10</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={reviewForm.rating}
                          onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                          className="mt-3 w-full accent-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">????? ??????</label>
                    <textarea
                      rows="6"
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="??? ???????????, ??? ???, ??? ??? ????????? ????? ?????????..."
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reviewSubmitting ? '????????...' : '???????????? ?????'}
                    </button>
                  </div>
                </form>
              </section>

              {contentData.criticReviewsList.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-100">???????? ????????</h2>
                    {contentData.criticReviewsList.length > 5 && (
                      <button
                        onClick={() => setShowAllCriticReviews(!showAllCriticReviews)}
                        className="rounded-full border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-300"
                      >
                        {showAllCriticReviews ? '??????' : '???????? ???'}
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {(showAllCriticReviews ? contentData.criticReviewsList : contentData.criticReviewsList.slice(0, 5)).map((review) => (
                      <CriticReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-100">?????? ?????????????</h2>
                  <select
                    value={userReviewSort}
                    onChange={(e) => setUserReviewSort(e.target.value)}
                    className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm font-semibold text-slate-300 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="helpful">????? ????????</option>
                    <option value="recent">????????</option>
                    <option value="highest">??????? ??????</option>
                    <option value="lowest">?????? ??????</option>
                  </select>
                </div>

                <div className="grid gap-4">
                  {sortedUserReviews.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-600 bg-slate-900/50 p-8 text-center text-slate-500 shadow-sm">
                      ??????? ???? ???. ???????? ??????.
                    </div>
                  ) : (
                    sortedUserReviews.slice(0, 6).map((review) => (
                      <article key={review.id} id={`review-${review.id}`} className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={review.userAvatar}
                              alt={review.userName}
                              className="h-12 w-12 rounded-full object-cover ring-1 ring-white/10"
                            />
                            <div>
                              <h4 className="font-bold text-slate-100">{review.userName}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                <span>{formatDate(review.date)}</span>
                                <span>?</span>
                                <span className={review.type === 'positive' ? 'text-emerald-600' : review.type === 'negative' ? 'text-rose-600' : 'text-slate-500'}>
                                  {review.type === 'positive' ? '?????????????' : review.type === 'negative' ? '?????????????' : '???????????'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {review.score ? (
                            <div className="rounded-2xl bg-slate-800 px-3 py-2 text-lg font-black text-slate-100 ring-1 ring-white/10">
                              {review.score.toFixed(0)}/10
                            </div>
                          ) : null}
                        </div>

                        {review.title && <h3 className="mt-4 text-lg font-bold text-slate-100">{review.title}</h3>}
                        <p className="mt-3 leading-7 text-slate-400">{review.content}</p>

                        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-800 pt-4">
                          <button
                            onClick={() => handleVoteReview(review.id, 'LIKE')}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-600"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            {review.helpful || 0}
                          </button>
                          <button
                            onClick={() => handleVoteReview(review.id, 'DISLIKE')}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-rose-600"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            {review.notHelpful || 0}
                          </button>
                          <button
                            onClick={() => handleShareReview(review.id)}
                            className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-400"
                          >
                            <Share2 className="w-4 h-4" />
                            ??????????
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-100">????????</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  {detailRows.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-800 px-4 py-3">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="font-semibold text-slate-100">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-100">??????????? ??????????</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-800 px-4 py-3">
                    <dt className="text-slate-500">?????????</dt>
                    <dd className="font-semibold text-slate-100">{contentData.platforms?.join(', ') || '?'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-800 px-4 py-3">
                    <dt className="text-slate-500">????????</dt>
                    <dd className="font-semibold text-slate-100">{contentData.criticReviews.total}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-800 px-4 py-3">
                    <dt className="text-slate-500">?????????????</dt>
                    <dd className="font-semibold text-slate-100">{contentData.userReviews.total}</dd>
                  </div>
                </dl>
              </section>

              <section className="md:col-span-2">
                <ReviewDistribution distribution={reviewDistribution} type="user" />
              </section>

              <section className="md:col-span-2">
                <ExpectationsWidget contentId={contentData.id} actualRating={contentData.userScore} />
              </section>
            </div>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-100">??????? ??????</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <div className="flex items-center justify-between gap-4"><span>????? ????????</span><span className="font-semibold text-slate-100">{contentData.criticReviews.total + contentData.userReviews.total}</span></div>
              <div className="flex items-center justify-between gap-4"><span>?????? ?????????????</span><span className="font-semibold text-slate-100">{contentData.userScore || '?'}</span></div>
              <div className="flex items-center justify-between gap-4"><span>??????</span><span className="font-semibold text-slate-100">{contentData.type}</span></div>
            </div>
          </section>

          <ReviewDistribution distribution={reviewDistribution} type="user" />

          <ExpectationsWidget contentId={contentData.id} actualRating={contentData.userScore} />

          {contentData.trailerUrl && (
            <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-100">?????</h3>
              <a
                href={contentData.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
              >
                <Play className="w-4 h-4" />
                ???????? ???????
              </a>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

export default DetailedContentPage
