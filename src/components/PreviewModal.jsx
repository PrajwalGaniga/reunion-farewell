import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { timeAgo } from '../utils/timeAgo';
import './PreviewModal.css';

const TAG_COLORS = {
  Memory: '#E8001D', Funny: '#FFD700', Emotional: '#A29BFE',
  'Group Shot': '#00E676', 'Wild Card': '#FF9F43',
  Group: '#00E676', Other: '#4A9EFF',
};

export default function PreviewModal({ item, onClose, showToast, onDeleted }) {
  const [downloading, setDownloading] = useState(false);
  const [toggling,    setToggling]    = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  if (!item) return null;
  const tagColor = TAG_COLORS[item.tag] || '#6666AA';

  /* ── Download ───────────────────────────────────── */
  const handleDownload = async () => {
    if (item.downloaded) {
      const ok = window.confirm("You've already downloaded this. Download again?");
      if (!ok) return;
    }
    setDownloading(true);
    try {
      const res  = await fetch(item.fileUrl);
      const blob = await res.blob();
      const ext  = item.fileType === 'video' ? 'mp4' : 'jpg';
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `memory-${(item.name || 'anon').replace(/\s+/g, '-')}-${item.id.slice(0,6)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      await updateDoc(doc(db, 'uploads', item.id), {
        downloaded: true,
        downloadedAt: serverTimestamp(),
      });
      showToast('Downloaded! ✓', 'success');
    } catch {
      showToast('Download failed.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  /* ── Toggle Selected ────────────────────────────── */
  const handleToggleSelected = async () => {
    setToggling(true);
    try {
      await updateDoc(doc(db, 'uploads', item.id), { selected: !item.selected });
      showToast(item.selected ? 'Unmarked' : 'Marked as picked ⭐', 'info');
    } catch { showToast('Update failed.', 'error'); }
    finally { setToggling(false); }
  };

  /* ── Toggle Used ────────────────────────────────── */
  const handleToggleUsed = async () => {
    setToggling(true);
    try {
      await updateDoc(doc(db, 'uploads', item.id), { used: !item.used });
      showToast(item.used ? 'Unmarked' : 'Marked as used ✓', 'success');
    } catch { showToast('Update failed.', 'error'); }
    finally { setToggling(false); }
  };

  /* ── Delete ─────────────────────────────────────── */
  const handleDelete = async () => {
    const ok = window.confirm('Delete this memory? This cannot be undone.');
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'uploads', item.id));
      showToast('Memory deleted.', 'info');
      onClose();
      onDeleted?.(item.id);
    } catch { showToast('Delete failed.', 'error'); setDeleting(false); }
  };

  return (
    <div className="pm-overlay" onClick={onClose} role="dialog" aria-modal>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="pm-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Media */}
        <div className="pm-media">
          {item.fileType === 'video' ? (
            <video src={item.fileUrl} controls playsInline className="pm-media__el" />
          ) : (
            <img src={item.fileUrl} alt={`Memory by ${item.name}`} className="pm-media__el" />
          )}
        </div>

        {/* Info */}
        <div className="pm-info">
          <div className="pm-info__top">
            <span className="pm-name">{item.name || 'Anonymous Wall-Crawler'}</span>
            <span className="pm-tag" style={{ background: tagColor + '33', color: tagColor, borderColor: tagColor + '55' }}>
              {item.tag}
            </span>
          </div>
          {item.message && (
            <p className="pm-message">"{item.message}"</p>
          )}
          <span className="pm-date">{timeAgo(item.createdAt)}</span>
        </div>

        {/* Actions */}
        <div className="pm-actions">
          <button
            className="pm-action-btn pm-action-btn--dl"
            onClick={handleDownload}
            disabled={downloading || deleting}
          >
            {downloading ? '…' : '⬇'} Download
          </button>

          <button
            className={`pm-action-btn ${item.selected ? 'pm-action-btn--active-gold' : ''}`}
            onClick={handleToggleSelected}
            disabled={toggling || deleting}
          >
            {item.selected ? '⭐ Picked' : '☆ Pick'}
          </button>

          <button
            className={`pm-action-btn ${item.used ? 'pm-action-btn--active-green' : ''}`}
            onClick={handleToggleUsed}
            disabled={toggling || deleting}
          >
            {item.used ? '✓ Used' : '✓ Mark Used'}
          </button>

          <button
            className="pm-action-btn pm-action-btn--delete"
            onClick={handleDelete}
            disabled={deleting || toggling}
          >
            {deleting ? '…' : '🗑'} Delete
          </button>
        </div>
      </div>
    </div>
  );
}
