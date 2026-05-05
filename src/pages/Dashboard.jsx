import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import MediaCard from '../components/MediaCard';
import PreviewModal from '../components/PreviewModal';
import { Toast, useToasts } from '../components/Toast';
import './Dashboard.css';

const FILTERS = [
  { label: 'All',          value: 'all'       },
  { label: '🖼 Images',    value: 'images'    },
  { label: '🎬 Videos',    value: 'videos'    },
  { label: '📸 Memory',    value: 'Memory'    },
  { label: '😂 Funny',     value: 'Funny'     },
  { label: '🥺 Emotional', value: 'Emotional' },
  { label: '👥 Group Shot',value: 'Group Shot'},
  { label: '🃏 Wild Card', value: 'Wild Card' },
  { label: '⭐ Selected',  value: 'selected'  },
  { label: '✓ Used',       value: 'used'      },
  { label: '⬇ Downloaded', value: 'downloaded'},
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToasts();

  const [uploads,    setUploads]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [previewItem,setPreviewItem]= useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds,setSelectedIds]= useState(new Set());
  const [bulkBusy,   setBulkBusy]   = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  /* ── Firestore real-time listener ──────────────── */
  useEffect(() => {
    const q = query(collection(db, 'uploads'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setUploads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  /* ── Filtered list ──────────────────────────────── */
  const filtered = uploads.filter((item) => {
    const f = filter;
    const matchFilter =
      f === 'all'        ? true :
      f === 'images'     ? item.fileType === 'image' :
      f === 'videos'     ? item.fileType === 'video' :
      f === 'selected'   ? !!item.selected :
      f === 'used'       ? !!item.used :
      f === 'downloaded' ? !!item.downloaded :
      item.tag === f;
    const matchSearch = !search ||
      (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.message || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  /* ── Stats ──────────────────────────────────────── */
  const totalCount = uploads.length;
  const selCount   = uploads.filter((u) => u.selected).length;
  const usedCount  = uploads.filter((u) => u.used).length;
  const imgCount   = uploads.filter((u) => u.fileType === 'image').length;
  const vidCount   = uploads.filter((u) => u.fileType === 'video').length;

  /* ── Select mode helpers ────────────────────────── */
  const enterSelectMode = useCallback(() => setSelectMode(true), []);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll  = () => setSelectedIds(new Set(filtered.map((u) => u.id)));
  const cancelSelect = () => { setSelectMode(false); setSelectedIds(new Set()); };

  /* ── Bulk Download (JSZip) ──────────────────────── */
  const handleBulkDownload = async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    showToast(`Preparing ${selectedIds.size} files…`, 'info');
    try {
      const JSZip    = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');
      const zip = new JSZip();
      const folder = zip.folder('memories');
      for (const id of selectedIds) {
        const item = uploads.find((u) => u.id === id);
        if (!item) continue;
        const res  = await fetch(item.fileUrl);
        const blob = await res.blob();
        const ext  = item.fileType === 'video' ? 'mp4' : 'jpg';
        folder.file(`${(item.name || 'anon').replace(/\s+/g, '-')}-${id.slice(0,6)}.${ext}`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'memories.zip');
      showToast('Download ready! ✓', 'success');
    } catch { showToast('Bulk download failed.', 'error'); }
    finally { setBulkBusy(false); }
  };

  /* ── Bulk Mark Used ─────────────────────────────── */
  const handleBulkMarkUsed = async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all(
        [...selectedIds].map((id) => updateDoc(doc(db, 'uploads', id), { used: true }))
      );
      showToast(`Marked ${selectedIds.size} as used ✓`, 'success');
      cancelSelect();
    } catch { showToast('Bulk update failed.', 'error'); }
    finally { setBulkBusy(false); }
  };

  /* ── Sign out ───────────────────────────────────── */
  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut(auth);
    navigate('/login', { replace: true });
  };

  /* ── Preview item stays in sync with Firestore ──── */
  const livePreviewItem = previewItem
    ? uploads.find((u) => u.id === previewItem.id) || previewItem
    : null;

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="db-page">

      {/* ── STICKY TOP BAR ─────────────────────────── */}
      <header className="db-topbar">
        <div className="db-topbar__left">
          <span className="db-topbar__spider">🕷️</span>
          <span className="db-topbar__title">Memory Wall</span>
        </div>
        <div className="db-topbar__right">
          {!selectMode && (
            <button className="db-select-btn" onClick={enterSelectMode}>Select</button>
          )}
          <button className="db-signout-btn" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? '…' : 'Sign Out'}
          </button>
        </div>
      </header>

      {/* ── STATS ROW ──────────────────────────────── */}
      <div className="db-stats-scroll">
        <div className="db-stats">
          <span className="db-stat">📁 Total: <strong>{totalCount}</strong></span>
          <span className="db-stat db-stat--gold">⭐ Selected: <strong>{selCount}</strong></span>
          <span className="db-stat db-stat--green">✓ Used: <strong>{usedCount}</strong></span>
          <span className="db-stat">🖼 Images: <strong>{imgCount}</strong></span>
          <span className="db-stat">🎬 Videos: <strong>{vidCount}</strong></span>
        </div>
      </div>

      {/* ── SEARCH ─────────────────────────────────── */}
      <div className="db-search-wrap">
        <span className="db-search-icon">🔍</span>
        <input
          className="db-search"
          type="search"
          placeholder="Search by name or message…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="db-search"
        />
      </div>

      {/* ── FILTER BAR ─────────────────────────────── */}
      <div className="db-filter-scroll">
        <div className="db-filters">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`db-filter-btn ${filter === f.value ? 'db-filter-btn--active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID ───────────────────────────────────── */}
      <main className="db-main">
        {loading ? (
          <div className="db-loading">
            <div className="loading-spinner" />
            <p>Loading memories…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="db-empty">
            <span>📭</span>
            <h2>{uploads.length === 0 ? 'No memories yet' : 'No results'}</h2>
            <p>{uploads.length === 0 ? 'Be the first to share!' : 'Try a different filter.'}</p>
          </div>
        ) : (
          <div className="db-grid">
            {filtered.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                onOpen={setPreviewItem}
                selectMode={selectMode}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onEnterSelectMode={enterSelectMode}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── SELECT ACTION BAR ──────────────────────── */}
      {selectMode && (
        <div className="db-action-bar">
          <button className="db-action-btn" onClick={selectAll} disabled={bulkBusy}>
            Select All
          </button>
          <button className="db-action-btn db-action-btn--dl" onClick={handleBulkDownload} disabled={bulkBusy || selectedIds.size === 0}>
            {bulkBusy ? '…' : `⬇ Download (${selectedIds.size})`}
          </button>
          <button className="db-action-btn db-action-btn--used" onClick={handleBulkMarkUsed} disabled={bulkBusy || selectedIds.size === 0}>
            ✓ Mark Used ({selectedIds.size})
          </button>
          <button className="db-action-btn db-action-btn--cancel" onClick={cancelSelect}>
            Cancel
          </button>
        </div>
      )}

      {/* ── PREVIEW MODAL ──────────────────────────── */}
      {livePreviewItem && (
        <PreviewModal
          item={livePreviewItem}
          onClose={() => setPreviewItem(null)}
          showToast={showToast}
          onDeleted={() => setPreviewItem(null)}
        />
      )}

      {/* ── TOASTS ─────────────────────────────────── */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
