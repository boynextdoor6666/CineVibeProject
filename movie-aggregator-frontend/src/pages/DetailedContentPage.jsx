import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, Calendar, Clock, Star, Users, Globe, TrendingUp, 
  Heart, Share2, Bookmark, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown 
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
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

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 10, content: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const formatErrorMessage = (value, fallback = 'Неизвестная ошибка') => {
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
        ]);
        setContent(contentRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (user) {
      checkWatchlist();
    }
  }, [user, id]);

  const checkWatchlist = async () => {
    try {
      const res = await axios.get('/api/users/me/watchlist');
      // Fix: backend returns content_id, not id
      const found = res.data.some(item => (item.content_id || item.id) === Number(id));
      setIsInWatchlist(found);
    } catch (error) {
      console.error('Failed to check watchlist:', error);
    }
  };

  const handleToggleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return alert('Войдите, чтобы добавить в список');
    
    setWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        await axios.delete(`/api/users/me/watchlist/${id}`);
        alert('Удалено из списка');
      } else {
        await axios.post(`/api/users/me/watchlist/${id}`);
        alert('Добавлено в список');
      }
      setIsInWatchlist(!isInWatchlist);
    } catch (error) {
      console.error(error);
      alert('Ошибка обновления списка: ' + formatErrorMessage(error.response?.data, error.message));
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Войдите, чтобы оставить отзыв');
    setReviewSubmitting(true);
    try {
      await axios.post('/api/reviews', {
        content_id: Number(id),
        rating: Number(reviewForm.rating),
        content: reviewForm.content
      });
      setShowReviewModal(false);
      setReviewForm({ rating: 10, content: '' });
      // Refresh reviews
      const res = await axios.get(`/api/reviews/content/${id}`);
      setReviews(res.data);
      alert('Отзыв опубликован!');
    } catch (error) {
      alert('Ошибка публикации отзыва: ' + formatErrorMessage(error.response?.data, error.message));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleVoteReview = async (reviewId, type) => {
    console.log('Voting for review:', reviewId, type);
    if (!user) return alert('Войдите, чтобы голосовать');
    if (!reviewId) return alert('Ошибка: ID отзыва не найден');

    try {
      await axios.post(`/api/reviews/${reviewId}/vote`, { type });
      const res = await axios.get(`/api/reviews/content/${id}`);
      setReviews(res.data);
      // alert('Голос принят!'); // Optional feedback
    } catch (error) {
      console.error(error);
      alert('Ошибка голосования: ' + formatErrorMessage(error.response?.data, error.message));
    }
  };

  const handleShareReview = (reviewId) => {
    if (!reviewId) return;
    const url = `${window.location.origin}/content/${id}#review-${reviewId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Ссылка на отзыв скопирована в буфер обмена!');
    }).catch(() => {
      alert('Не удалось скопировать ссылку');
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Загрузка...</div>;
  if (!content) return <div className="min-h-screen flex items-center justify-center text-white">Контент не найден</div>;

  // Map backend data to UI structure
  const contentData = {
    id: content.id,
    title: content.title,
    type: content.content_type?.toLowerCase() || 'movie',
    year: content.release_year,
    releaseDate: content.created_at,
    
    coverImage: content.poster_url || 'https://placehold.co/1920x600/1e293b/ffffff?text=No+Cover',
    logo: null,
    trailerUrl: content.trailer_url,
    
    metascore: content.critics_rating ? Math.round(content.critics_rating * 10) : 0,
    userScore: content.audience_rating || 0,
    
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
    
    developer: content.developer,
    publisher: content.publisher,
    platforms: content.platforms || [],
    genre: content.genre ? [content.genre] : [],
    esrbRating: content.esrb_rating,
    players: content.players,
    
    summary: content.description?.slice(0, 150) + '...',
    description: content.description,
    
    screenshots: [],
    trailers: content.trailer_url ? [{ title: 'Official Trailer', url: content.trailer_url, thumbnail: 'https://placehold.co/480x270' }] : [],
    
    technicalInfo: content.technical_info || { systemRequirements: { minimum: {}, recommended: {} }, languages: [] },
    
    criticReviewsList: reviews.filter(r => r.user?.role === 'CRITIC' || r.role === 'CRITIC').map(r => ({
      id: r.id,
      publicationName: 'Critic',
      publicationLogo: 'https://placehold.co/80x30?text=Critic',
      criticName: r.username || r.user?.username || 'Unknown',
      score: r.rating * 10,
      excerpt: r.text,
      fullReviewUrl: '#',
      publishDate: r.created_at,
      type: r.rating >= 7 ? 'positive' : r.rating >= 4 ? 'mixed' : 'negative'
    })),
    
    userReviewsList: reviews.filter(r => r.user?.role !== 'CRITIC' && r.role !== 'CRITIC').map(r => ({
      id: r.id,
      userName: r.username || r.user?.username || 'User',
      userAvatar: r.avatar_url || r.user?.avatar_url || 'https://placehold.co/50',
      score: r.rating,
      title: r.title || 'Review',
      content: r.text || r.content,
      helpful: Number(r.likes || 0),
      notHelpful: Number(r.dislikes || 0),
      containsSpoilers: false,
      date: r.created_at,
      type: r.rating >= 7 ? 'positive' : r.rating >= 4 ? 'neutral' : 'negative',
      detailedRatings: {}
    })),
    
    similarContent: []
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative -mx-4">
        {/* Background Image */}
        <div className="h-[450px] relative overflow-hidden">
          <img
            src={contentData.coverImage}
            alt={contentData.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute bottom-8 left-0 right-0 px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              {/* Постер */}
              <div className="flex-shrink-0">
                <img
                  src={`https://placehold.co/300x450/1e293b/ffffff?text=${contentData.title}`}
                  alt={contentData.title}
                  className="w-48 rounded-lg shadow-2xl border border-gray-800"
                />
              </div>

              {/* Информация */}
              <div className="flex-1 space-y-4">
                {/* Logo */}
                {contentData.logo && (
                  <img src={contentData.logo} alt={contentData.title} className="h-16 w-auto" />
                )}

                {/* Заголовок и год */}
                <div>
                  <h1 className="text-5xl font-bold text-white mb-2">{contentData.title}</h1>
                  <div className="flex items-center gap-3 text-gray-400">
                    <span>{contentData.year}</span>
                    <span>•</span>
                    <span>{contentData.genre.join(', ')}</span>
                    <span>•</span>
                    <span>{contentData.esrbRating}</span>
                  </div>
                </div>

                {/* Метрики */}
                <div className="flex items-center gap-6">
                  <MetascoreBadge score={contentData.metascore} size="large" />
                  <UserScoreBadge 
                    score={contentData.userScore} 
                    reviewCount={contentData.userReviews.total}
                    size="large"
                  />
                </div>

                {/* Кнопки действий */}
                <div className="flex flex-wrap gap-3">
                  <button className="px-6 py-3 bg-[#f5c518] text-black font-bold rounded hover:bg-[#f5c518]/90 transition flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Смотреть трейлер
                  </button>
                  <button 
                    onClick={handleToggleWatchlist}
                    disabled={watchlistLoading}
                    className={`px-6 py-3 font-bold rounded border transition flex items-center gap-2 ${isInWatchlist ? 'bg-[#f5c518] text-black border-[#f5c518] hover:bg-[#f5c518]/90' : 'bg-[#1a1a1a] text-white border-gray-700 hover:bg-[#252525]'}`}
                  >
                    <Bookmark className={`w-5 h-5 ${isInWatchlist ? 'fill-black' : ''}`} />
                    {isInWatchlist ? 'В списке' : 'В список'}
                  </button>
                  <button className="px-6 py-3 bg-[#1a1a1a] text-white font-bold rounded hover:bg-[#252525] border border-gray-700 transition flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Поделиться
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-800">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'text-white border-b-2 border-[#f5c518]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Обзор
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 font-semibold transition-colors ${
              activeTab === 'reviews'
                ? 'text-white border-b-2 border-[#f5c518]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Рецензии ({contentData.criticReviews.total + contentData.userReviews.total})
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`pb-4 font-semibold transition-colors ${
              activeTab === 'media'
                ? 'text-white border-b-2 border-[#f5c518]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Медиа
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-4 font-semibold transition-colors ${
              activeTab === 'details'
                ? 'text-white border-b-2 border-[#f5c518]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Детали
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Описание */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">О игре</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {contentData.description}
                </p>
              </div>

              {/* Critic Reviews Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Рецензии критиков</h2>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-[#f5c518] hover:text-[#f5c518]/80 text-sm font-semibold"
                  >
                    Все рецензии →
                  </button>
                </div>
                <div className="space-y-4">
                  {contentData.criticReviewsList.slice(0, 3).map((review) => (
                    <CriticReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <>
              {/* Critic Reviews */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Рецензии критиков</h2>
                <div className="space-y-4">
                  {(showAllCriticReviews
                    ? contentData.criticReviewsList
                    : contentData.criticReviewsList.slice(0, 5)
                  ).map((review) => (
                    <CriticReviewCard key={review.id} review={review} />
                  ))}
                </div>
                {contentData.criticReviewsList.length > 5 && (
                  <button
                    onClick={() => setShowAllCriticReviews(!showAllCriticReviews)}
                    className="w-full py-3 bg-[#141414] text-white rounded hover:bg-[#1a1a1a] border border-gray-800 transition flex items-center justify-center gap-2"
                  >
                    {showAllCriticReviews ? (
                      <>
                        Скрыть <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Показать все рецензии критиков <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* User Reviews */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Отзывы пользователей</h2>
                  <select
                    value={userReviewSort}
                    onChange={(e) => setUserReviewSort(e.target.value)}
                    className="px-3 py-2 bg-[#141414] text-white rounded border border-gray-800"
                  >
                    <option value="helpful">Самые полезные</option>
                    <option value="recent">Недавние</option>
                    <option value="highest">Высокие оценки</option>
                    <option value="lowest">Низкие оценки</option>
                  </select>
                </div>

                <div className="space-y-6">
                  {/* Debug info */}
                  {contentData.userReviewsList.length === 0 && (
                    <div className="text-yellow-500 p-4 bg-yellow-500/10 rounded">
                      Отзывов пока нет. Напишите первый отзыв!
                    </div>
                  )}

                  {/* Kinopoisk-style Review Distribution Bar */}
                  {contentData.userReviewsList.length > 0 && (
                    <div className="flex h-2 rounded overflow-hidden mb-6">
                      <div className="bg-[#3bb33b] h-full" style={{ width: '70%' }} title="Положительные (70%)" />
                      <div className="bg-[#777] h-full" style={{ width: '20%' }} title="Нейтральные (20%)" />
                      <div className="bg-[#ff0000] h-full" style={{ width: '10%' }} title="Отрицательные (10%)" />
                    </div>
                  )}

                  {contentData.userReviewsList.map((review) => {
                    console.log('Rendering review:', review); // Debug
                    // Determine styles based on review type
                    let bgClass = 'bg-[#1f1f1f]'; // Default neutral
                    let borderClass = 'border-[#2d2d2d]';
                    
                    if (review.type === 'positive') {
                      bgClass = 'bg-[#1f2d22]'; // Dark Greenish
                      borderClass = 'border-[#2d4a33]';
                    } else if (review.type === 'negative') {
                      bgClass = 'bg-[#2d1f1f]'; // Dark Reddish
                      borderClass = 'border-[#4a2d2d]';
                    }

                    return (
                      <div
                        key={review.id}
                        id={`review-${review.id}`}
                        className={`${bgClass} ${borderClass} border rounded-lg p-6 transition-colors`}
                      >
                        {/* Заголовок */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-start gap-4">
                            <img
                              src={review.userAvatar}
                              alt={review.userName}
                              className="w-12 h-12 rounded-full border border-gray-700"
                            />
                            <div>
                              <h4 className="font-bold text-white text-lg">{review.userName}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>{formatDate(review.date)}</span>
                                {review.type === 'positive' && <span className="text-[#3bb33b] font-medium">Положительный</span>}
                                {review.type === 'negative' && <span className="text-[#ff4d4d] font-medium">Отрицательный</span>}
                                {review.type === 'neutral' && <span className="text-gray-400 font-medium">Нейтральный</span>}
                              </div>
                            </div>
                          </div>
                          {review.score && (
                            <div className="px-3 py-1 bg-black/30 rounded text-xl font-bold text-white border border-white/10">
                              {review.score.toFixed(0)}/10
                            </div>
                          )}
                        </div>

                        {/* Заголовок отзыва */}
                        <h3 className="text-xl font-bold text-white mb-3">{review.title}</h3>

                        {/* Текст отзыва */}
                        <div className="text-gray-200 leading-relaxed mb-6 text-[15px]">
                          {review.content}
                        </div>

                        {/* Голосование и действия */}
                        <div style={{ position: 'relative', zIndex: 9999, backgroundColor: '#222', padding: '16px', marginTop: '16px', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span style={{ color: '#888', fontSize: '14px' }}>Полезный отзыв?</span>
                              <button 
                                style={{ 
                                  backgroundColor: '#3bb33b', 
                                  color: 'white', 
                                  padding: '8px 16px', 
                                  borderRadius: '4px', 
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                onClick={() => {
                                  alert('Кнопка ДА нажата! ID: ' + review.id);
                                  handleVoteReview(review.id, 'LIKE');
                                }}
                              >
                                👍 Да ({review.helpful})
                              </button>
                              <button 
                                style={{ 
                                  backgroundColor: '#ff4d4d', 
                                  color: 'white', 
                                  padding: '8px 16px', 
                                  borderRadius: '4px', 
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                onClick={() => {
                                  alert('Кнопка НЕТ нажата! ID: ' + review.id);
                                  handleVoteReview(review.id, 'DISLIKE');
                                }}
                              >
                                👎 Нет ({review.notHelpful})
                              </button>
                            </div>
                            <button 
                              style={{ 
                                backgroundColor: '#555', 
                                color: 'white', 
                                padding: '8px 16px', 
                                borderRadius: '4px', 
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                              onClick={() => {
                                alert('Кнопка КОММЕНТИРОВАТЬ нажата! ID: ' + review.id);
                                handleShareReview(review.id);
                              }}
                            >
                              💬 Комментировать
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Кнопка написать отзыв */}
                <button 
                  onClick={() => setShowReviewModal(true)}
                  className="w-full py-4 bg-[#f5c518] text-black font-bold rounded hover:bg-[#f5c518]/90 transition"
                >
                  Написать отзыв
                </button>
              </div>
            </>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <>
              {/* Трейлеры */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Трейлеры</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contentData.trailers.map((trailer, index) => (
                    <div key={index} className="relative group cursor-pointer">
                      <img
                        src={trailer.thumbnail}
                        alt={trailer.title}
                        className="w-full rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-16 h-16 text-white" />
                      </div>
                      <p className="text-sm text-gray-300 mt-2">{trailer.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Скриншоты */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Скриншоты</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contentData.screenshots.map((screenshot, index) => (
                    <div key={index} className="group cursor-pointer">
                      <img
                        src={screenshot.url}
                        alt={screenshot.caption}
                        className="w-full rounded-lg hover:scale-105 transition-transform"
                      />
                      <p className="text-sm text-gray-400 mt-2">{screenshot.caption}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <>
              {/* Системные требования (для игр) */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Системные требования</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Минимальные */}
                  <div className="bg-[#141414] border border-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Минимальные</h3>
                    <dl className="space-y-2 text-sm">
                      {Object.entries(contentData.technicalInfo.systemRequirements.minimum).map(
                        ([key, value]) => (
                          <div key={key}>
                            <dt className="text-gray-500 capitalize">{key}:</dt>
                            <dd className="text-gray-300">{value}</dd>
                          </div>
                        )
                      )}
                    </dl>
                  </div>

                  {/* Рекомендуемые */}
                  <div className="bg-[#141414] border border-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Рекомендуемые</h3>
                    <dl className="space-y-2 text-sm">
                      {Object.entries(contentData.technicalInfo.systemRequirements.recommended).map(
                        ([key, value]) => (
                          <div key={key}>
                            <dt className="text-gray-500 capitalize">{key}:</dt>
                            <dd className="text-gray-300">{value}</dd>
                          </div>
                        )
                      )}
                    </dl>
                  </div>
                </div>
              </div>

              {/* Языки */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Поддерживаемые языки</h2>
                <div className="flex flex-wrap gap-2">
                  {contentData.technicalInfo.languages.map((lang, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#141414] text-gray-300 rounded-full text-sm border border-gray-800"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score Summary */}
          <div className="bg-[#141414] border border-gray-800 rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Оценки</h3>
              <div className="flex justify-around items-center mb-6">
                <div className="text-center">
                  <MetascoreBadge score={contentData.metascore} size="large" />
                </div>
                <div className="text-center">
                  <UserScoreBadge 
                    score={contentData.userScore} 
                    reviewCount={contentData.userReviews.total}
                    size="large"
                  />
                </div>
              </div>
            </div>

            <ReviewDistribution distribution={contentData.criticReviews} type="critic" />
            <ReviewDistribution distribution={contentData.userReviews} type="user" />
          </div>

          {/* Expectations Widget - Hype vs Reality */}
          <ExpectationsWidget 
            contentId={Number(id)} 
            actualRating={contentData.userScore} 
          />

          {/* Информация */}
          <div className="bg-[#141414] border border-gray-800 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Информация</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Разработчик</dt>
                <dd className="text-gray-300 font-medium">{contentData.developer}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Издатель</dt>
                <dd className="text-gray-300 font-medium">{contentData.publisher}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Дата выхода</dt>
                <dd className="text-gray-300 font-medium">
                  {formatDate(contentData.releaseDate)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Платформы</dt>
                <dd className="text-gray-300 font-medium">
                  {contentData.platforms.join(', ')}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Жанр</dt>
                <dd className="text-gray-300 font-medium">{contentData.genre.join(', ')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Рейтинг</dt>
                <dd className="text-gray-300 font-medium">{contentData.esrbRating}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Игроки</dt>
                <dd className="text-gray-300 font-medium">{contentData.players}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Размер</dt>
                <dd className="text-gray-300 font-medium">{contentData.technicalInfo.fileSize}</dd>
              </div>
            </dl>
          </div>

          {/* Похожие игры */}
          <div className="bg-[#141414] border border-gray-800 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Похожие игры</h3>
            <div className="space-y-4">
              {contentData.similarContent.map((item) => (
                <Link
                  key={item.id}
                  to={`/game/${item.id}`}
                  className="flex gap-3 group"
                >
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-20 h-28 object-cover rounded"
                  />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-white group-hover:text-[#f5c518] transition">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <MetascoreBadge score={item.metascore} size="small" />
                      <UserScoreBadge score={item.userScore} size="small" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] p-6 rounded-lg max-w-lg w-full border border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-4">Написать отзыв</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Оценка (1-10)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({...reviewForm, rating: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Текст отзыва</label>
                <textarea 
                  rows="5"
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({...reviewForm, content: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded p-2 text-white"
                  required
                  placeholder="Поделитесь своими впечатлениями..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-6 py-2 bg-[#f5c518] text-black font-bold rounded hover:bg-[#f5c518]/90 disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Публикация...' : 'Опубликовать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedContentPage;
