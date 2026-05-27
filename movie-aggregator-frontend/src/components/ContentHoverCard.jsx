import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Star, Clock, Calendar, Users } from 'lucide-react'
import MetascoreBadge from './MetascoreBadge'

const ContentHoverCard = ({ item, children }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const timeoutRef = useRef(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const scrollY = window.scrollY
      
      // Calculate position
      let top = rect.top + scrollY
      let left = rect.right + 12 // 12px gap
      
      // Check horizontal space (if not enough space on right, show on left)
      if (rect.right + 320 > window.innerWidth) {
        left = rect.left - 332 // 320px width + 12px gap
      }

      // Check vertical space (simple check, can be improved)
      // If element is too low, shift tooltip up
      if (rect.top > window.innerHeight - 300) {
        top = rect.bottom + scrollY - 200 // Shift up
      }

      setPosition({ top, left })
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 100)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative h-full"
      >
        {children}
      </div>

      {isVisible && createPortal(
        <div
          className="absolute z-[9999] w-[320px] bg-[#0a0a0a]/95 border border-[#ff6600]/20 rounded-2xl shadow-2xl shadow-black/80 p-5 transform transition-all animate-scale-in pointer-events-none backdrop-blur-2xl ring-1 ring-white/5"
          style={{ top: position.top, left: position.left }}
        >
          {/* Decorative Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ff6600]/10 rounded-full blur-[40px] pointer-events-none"></div>

          {/* Header */}
          <div className="flex justify-between items-start mb-3 relative z-10">
            <h3 className="text-lg font-bold text-white leading-tight pr-2">{item.title}</h3>
            <div className="flex-shrink-0">
              <MetascoreBadge score={Number(item.critics_rating || item.avg_rating || 0) * 10} size="small" />
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex items-center flex-wrap gap-3 text-xs text-slate-400 mb-4">
            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
              <Calendar size={12} />
              {item.release_year}
            </span>
            {item.runtime && (
              <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                <Clock size={12} />
                {item.runtime} мин
              </span>
            )}
            {item.genre && (
              <span className="px-2 py-1 bg-accent-500/10 text-accent-400 rounded text-[10px] uppercase tracking-wider font-bold border border-accent-500/20">
                {item.genre.split(',')[0]}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-slate-300 line-clamp-4 mb-4 leading-relaxed border-t border-white/5 pt-3">
            {item.description || 'Описание отсутствует.'}
          </p>

          {/* Footer Info */}
          <div className="space-y-2 text-xs border-t border-white/5 pt-3">
            {item.director && (
              <div className="flex gap-2">
                <span className="text-secondary-500 min-w-[60px]">Режиссер:</span>
                <span className="text-slate-100 font-medium">{item.director}</span>
              </div>
            )}
            {item.cast && (
              <div className="flex gap-2">
                <span className="text-secondary-500 min-w-[60px]">В ролях:</span>
                <span className="text-slate-100 line-clamp-1">{item.cast}</span>
              </div>
            )}
            {item.developer && (
              <div className="flex gap-2">
                <span className="text-secondary-500 min-w-[60px]">Разраб.:</span>
                <span className="text-slate-100">{item.developer}</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default ContentHoverCard
