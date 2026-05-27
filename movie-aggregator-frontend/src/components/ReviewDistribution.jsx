import React from 'react';

/**
 * ReviewDistribution - Компонент для отображения распределения отзывов
 * @param {object} distribution - Объект с количеством положительных, смешанных и отрицательных отзывов
 * @param {string} type - Тип отзывов ('critic' или 'user')
 */
const ReviewDistribution = ({ distribution, type = 'critic' }) => {
  const { positive = 0, mixed = 0, negative = 0 } = distribution;
  const total = positive + mixed + negative;

  // Вычисляем проценты
  const getPercentage = (value) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const positivePercent = getPercentage(positive);
  const mixedPercent = getPercentage(mixed);
  const negativePercent = getPercentage(negative);

  // Kinopoisk style colors
  const colors = {
    positive: '#22c55e',
    mixed: '#94a3b8', // Neutral/Gray
    negative: '#ef4444'
  };

  return (
    <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
          {type === 'critic' ? 'Рецензии критиков' : 'Отзывы пользователей'}
        </h3>
        <span className="text-sm text-slate-400">{total} всего</span>
      </div>

      {/* График распределения */}
      <div className="space-y-3">
        {/* Положительные */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: colors.positive }} className="font-semibold">Положительные</span>
            <span className="text-slate-400">
              {positive} ({positivePercent}%)
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${positivePercent}%`, backgroundColor: colors.positive }}
            />
          </div>
        </div>

        {/* Смешанные */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: colors.mixed }} className="font-semibold">Нейтральные</span>
            <span className="text-slate-400">
              {mixed} ({mixedPercent}%)
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${mixedPercent}%`, backgroundColor: colors.mixed }}
            />
          </div>
        </div>

        {/* Отрицательные */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: colors.negative }} className="font-semibold">Отрицательные</span>
            <span className="text-slate-400">
              {negative} ({negativePercent}%)
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${negativePercent}%`, backgroundColor: colors.negative }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDistribution;
