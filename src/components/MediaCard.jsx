import React, { useState, useRef, useCallback } from 'react';
import { timeAgo } from '../utils/timeAgo';
import './MediaCard.css';

const TAG_COLORS = {
  Memory:     '#E8001D',
  Funny:      '#FFD700',
  Emotional:  '#A29BFE',
  'Group Shot':'#00E676',
  'Wild Card':'#FF9F43',
  Group:      '#00E676',
  Other:      '#4A9EFF',
};

export default function MediaCard({ item, onOpen, selectMode, isSelected, onToggleSelect, onEnterSelectMode }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const longPressRef = useRef(null);

  const togglePlay = useCallback((e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  }, [playing]);

  const handleTouchStart = useCallback(() => {
    longPressRef.current = setTimeout(() => {
      onEnterSelectMode?.();
      onToggleSelect?.(item.id);
    }, 500);
  }, [item.id, onEnterSelectMode, onToggleSelect]);

  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressRef.current);
  }, []);

  const handleClick = useCallback(() => {
    if (selectMode) {
      onToggleSelect?.(item.id);
    } else {
      onOpen?.(item);
    }
  }, [selectMode, item, onOpen, onToggleSelect]);

  const tagColor = TAG_COLORS[item.tag] || '#6666AA';

  return (
    <div
      className={`mc ${isSelected ? 'mc--selected' : ''}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Memory by ${item.name}`}
    >
      {/* Select checkbox */}
      {selectMode && (
        <div className="mc__checkbox" onClick={(e) => { e.stopPropagation(); onToggleSelect?.(item.id); }}>
          <span className={`mc__checkbox-inner ${isSelected ? 'mc__checkbox-inner--checked' : ''}`}>
            {isSelected && '✓'}
          </span>
        </div>
      )}

      {/* Media area */}
      <div className="mc__media">
        {item.fileType === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={item.fileUrl}
              muted
              preload="metadata"
              loop
              playsInline
              className="mc__video"
              onEnded={() => setPlaying(false)}
            />
            <button
              className={`mc__play-btn ${playing ? 'mc__play-btn--hidden' : ''}`}
              onClick={togglePlay}
              aria-label="Play video"
            >▶</button>
          </>
        ) : (
          <img
            src={item.fileUrl}
            alt={`Memory by ${item.name}`}
            loading="lazy"
            className="mc__img"
          />
        )}

        {/* Badges */}
        <div className="mc__badges">
          {item.used      && <span className="mc__badge mc__badge--used">✓ USED</span>}
          {item.selected  && <span className="mc__badge mc__badge--selected">⭐ PICKED</span>}
          {item.downloaded && <span className="mc__badge mc__badge--dl">⬇ DL'd</span>}
        </div>

        {/* Bottom strip */}
        <div className="mc__strip">
          <span className="mc__name">{item.name || 'Anonymous'}</span>
          <div className="mc__strip-row2">
            <span className="mc__tag" style={{ background: tagColor + '33', color: tagColor, borderColor: tagColor + '55' }}>
              {item.tag}
            </span>
            <span className="mc__date">{timeAgo(item.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
