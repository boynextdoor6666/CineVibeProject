import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Star, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/**
 * Компонент "До/После" - система ожиданий
 * Позволяет пользователям оценить ожидания до просмотра
 * и показывает разницу между ожиданиями и реальностью
 */
const ExpectationsWidget = ({ contentId, actualRating: rawActualRating }) => {
  const { user } = useAuth();
  const [myExpectation, setMyExpectation] = useState(null);
  const [communityExpectations, setCommunityExpectations] = useState({ avgRating: 0, count: 0 });
  const [newRating, setNewRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);

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

  // Конвертируем actualRating в число
  const actualRating = rawActualRating != null ? parseFloat(rawActualRating) : null;
  const hasActualRating = actualRating !== null && !isNaN(actualRating);

  useEffect(() => {
    fetchExpectations();
  }, [contentId, user]);

  const fetchExpectations = async () => {
    try {
      // Получаем общие ожидания сообщества
      const communityRes = await axios.get(`/api/expectations/${contentId}`);
      setCommunityExpectations(communityRes.data);

      // Если пользователь авторизован, получаем его ожидания
      if (user) {
        try {
          const myRes = await axios.get(`/api/expectations/${contentId}/me`);
          if (myRes.data) {
            setMyExpectation(myRes.data);
            setNewRating(myRes.data.rating);
          }
        } catch (e) {
          // Пользователь ещё не оставлял ожидания
        }
      }
    } catch (error) {
      console.error('Failed to fetch expectations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExpectation = async () => {
    if (!user) {
      alert('Войдите, чтобы оставить свои ожидания');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/expectations/${contentId}`, { rating: newRating });
      setMyExpectation({ rating: newRating });
      // Обновляем общие данные
      fetchExpectations();
      alert('Ваши ожидания сохранены!');
    } catch (error) {
      alert('Ошибка сохранения: ' + formatErrorMessage(error.response?.data, error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Вычисляем разницу между ожиданиями и реальностью
  const calculateDifference = (expected, actual) => {
    if (!expected || actual === null || isNaN(actual)) return null;
    return actual - expected;
  };

  const getDifferenceIcon = (diff) => {
    if (diff === null) return <Minus className="w-5 h-5 text-slate-500" />;
    if (diff > 0) return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (diff < 0) return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-slate-500" />;
  };

  const getDifferenceText = (diff) => {
    if (diff === null) return 'Нет данных';
    if (diff > 1) return 'Превзошёл ожидания!';
    if (diff > 0) return 'Немного лучше ожиданий';
    if (diff < -1) return 'Ниже ожиданий';
    if (diff < 0) return 'Немного хуже ожиданий';
    return 'Соответствует ожиданиям';
  };

  const getDifferenceColor = (diff) => {
    if (diff === null) return 'text-slate-500';
    if (diff > 0) return 'text-green-500';
    if (diff < 0) return 'text-red-500';
    return 'text-yellow-500';
  };

  const communityDiff = calculateDifference(communityExpectations.avgRating, actualRating);
  const myDiff = myExpectation ? calculateDifference(myExpectation.rating, actualRating) : null;

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 animate-pulse shadow-sm">
        <div className="h-6 bg-slate-800 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-slate-100">Ожидания vs Реальность</h3>
      </div>

      {/* Статистика сообщества */}
      <div className="space-y-3">
        <h4 className="text-sm uppercase tracking-[0.18em] text-slate-400">Сообщество</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-400">
              {(parseFloat(communityExpectations.avgRating) || 0).toFixed(1)}
            </div>
            <div className="text-xs text-slate-400">Ожидали</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-100">
              {hasActualRating ? actualRating.toFixed(1) : '—'}
            </div>
            <div className="text-xs text-slate-400">Получили</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getDifferenceColor(communityDiff)}`}>
              {communityDiff !== null ? (communityDiff > 0 ? '+' : '') + communityDiff.toFixed(1) : '—'}
            </div>
            <div className="text-xs text-slate-400">Разница</div>
          </div>
        </div>

        {communityExpectations.count > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm">
            {getDifferenceIcon(communityDiff)}
            <span className={getDifferenceColor(communityDiff)}>
              {getDifferenceText(communityDiff)}
            </span>
          </div>
        )}

        <div className="text-center text-xs text-slate-400">
          {communityExpectations.count} {communityExpectations.count === 1 ? 'оценка' : 'оценок'} ожиданий
        </div>
      </div>

      {/* Разделитель */}
      <div className="border-t border-slate-800"></div>

      {/* Мои ожидания */}
      {user ? (
        <div className="space-y-3">
          <h4 className="text-sm uppercase tracking-[0.18em] text-slate-400">Мои ожидания</h4>
          
          {myExpectation ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(parseFloat(myExpectation.rating) || 0).toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-400">Я ожидал</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-100">
                    {hasActualRating ? actualRating.toFixed(1) : '—'}
                  </div>
                  <div className="text-xs text-slate-400">Реальность</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getDifferenceColor(myDiff)}`}>
                    {myDiff !== null ? (myDiff > 0 ? '+' : '') + myDiff.toFixed(1) : '—'}
                  </div>
                  <div className="text-xs text-slate-400">Для меня</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm">
                {getDifferenceIcon(myDiff)}
                <span className={getDifferenceColor(myDiff)}>
                  {getDifferenceText(myDiff)}
                </span>
              </div>

              <button
                onClick={() => setMyExpectation(null)}
                className="w-full py-2 text-sm text-slate-400 hover:text-slate-100 transition"
              >
                Изменить ожидания
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 text-center">
                Ещё не смотрели? Оцените свои ожидания!
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Мои ожидания:</span>
                  <span className="text-xl font-bold text-indigo-400">{newRating}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={newRating}
                  onChange={(e) => setNewRating(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Скептик</span>
                  <span>Хайп!</span>
                </div>
              </div>

              <button
                onClick={handleSubmitExpectation}
                disabled={submitting}
                className="w-full rounded-2xl bg-indigo-600 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Сохранение...' : 'Сохранить ожидания'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-slate-400">
            Войдите, чтобы оставить свои ожидания
          </p>
        </div>
      )}

      {/* Подсказка */}
      <div className="text-xs text-slate-400 text-center border-t border-white/10 pt-4">
        💡 Оцените ваши ожидания до просмотра, а потом сравните с реальной оценкой
      </div>
    </div>
  );
};

export default ExpectationsWidget;
