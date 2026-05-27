import React, { useEffect, useMemo, useState } from 'react'

const typeLabels = {
  movie: 'Фильм',
  series: 'Сериал',
  game: 'Игра',
  content: 'Контент'
}

const PosterFrame = ({
  src,
  alt,
  title,
  type = 'content',
  className = '',
  imageClassName = '',
  rounded = 'rounded-2xl',
  badge,
}) => {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [src])

  const displayTitle = title || alt || 'CineVibe'

  const initials = useMemo(() => {
    return displayTitle
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }, [displayTitle])

  const showImage = Boolean(src) && !hasError

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 ring-1 ring-white/10 ${rounded} ${className}`}>
      {showImage ? (
        <img
          src={src}
          alt={alt || displayTitle}
          className={`h-full w-full object-cover ${imageClassName}`}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className={`relative flex h-full w-full items-center justify-center p-4 text-center ${imageClassName}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.12),_transparent_55%)]" />
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-white/5 text-lg font-black text-indigo-400 shadow-sm ring-1 ring-white/10">
              {initials || 'CV'}
            </div>
            <p className="max-w-[10rem] text-sm font-semibold text-slate-300 line-clamp-2">
              {displayTitle}
            </p>
            <span className="mt-2 rounded-full bg-slate-800 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ring-1 ring-white/10">
              {typeLabels[type] || typeLabels.content}
            </span>
          </div>
        </div>
      )}

      {badge && <div className="absolute left-3 top-3 z-20">{badge}</div>}
    </div>
  )
}

export default PosterFrame
