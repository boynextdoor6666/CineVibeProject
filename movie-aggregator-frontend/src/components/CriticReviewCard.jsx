import React from 'react';
import { ExternalLink } from 'lucide-react';
import MetascoreBadge from './MetascoreBadge';

/**
 * CriticReviewCard - Карточка профессиональной рецензии
 */
const CriticReviewCard = ({ review }) => {
  const {
    publicationName,
    publicationLogo,
    criticName,
    score,
    excerpt,
    fullReviewUrl,
    publishDate,
    type
  } = review;

  // Форматируем дату
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Determine background color based on score (Kinopoisk style)
  let bgColor = 'bg-slate-900/50'; // Neutral
  if (score >= 70) {
    bgColor = 'bg-emerald-50'; // Positive
  } else if (score <= 40) {
    bgColor = 'bg-rose-50'; // Negative
  }

  return (
    <div className={`${bgColor} rounded-3xl border border-slate-800 p-6 shadow-sm transition-colors`}>
      <div className="flex gap-4">
        {/* Metascore Badge */}
        <div className="flex-shrink-0">
          <MetascoreBadge score={score} size="small" />
        </div>

        {/* Контент рецензии */}
        <div className="flex-1 space-y-3">
          {/* Заголовок с логотипом издания */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {publicationLogo && (
                  <img
                    src={publicationLogo}
                    alt={publicationName}
                    className="h-5 w-auto"
                  />
                )}
                <h4 className="font-semibold text-slate-100">
                  {publicationName}
                </h4>
              </div>
              {criticName && (
                <p className="text-sm text-slate-400">by {criticName}</p>
              )}
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {formatDate(publishDate)}
            </span>
          </div>

          {/* Цитата из рецензии */}
          <blockquote className="border-l-2 border-slate-800 pl-4 text-sm leading-relaxed italic text-slate-400">
            "{excerpt}"
          </blockquote>

          {/* Ссылка на полную рецензию */}
          {fullReviewUrl && (
            <a
              href={fullReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Читать полную рецензию
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default CriticReviewCard;
