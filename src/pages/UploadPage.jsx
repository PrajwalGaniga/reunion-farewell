import React, { useState, useRef, useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToCloudinary } from '../utils/uploadFile';
import './UploadPage.css';

const TAGS = [
  { label: '📸 Memory',   value: 'Memory'    },
  { label: '😂 Funny',    value: 'Funny'     },
  { label: '🥺 Emotional',value: 'Emotional' },
  { label: '👥 Group Shot',value: 'Group Shot'},
  { label: '🃏 Wild Card', value: 'Wild Card' },
];

const CONFETTI = Array.from({ length: 20 }, (_, i) => {
  const colors = ['#E8001D','#FFD700','#00E676','#F0F0FF','#FF6B35','#A29BFE','#FF9F43','#4ECDC4'];
  return {
    id: i,
    color: colors[i % colors.length],
    left: `${(i * 5.3) % 100}%`,
    delay: `${(i * 0.13) % 2}s`,
    size: `${6 + (i % 5) * 2}px`,
    shape: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0%',
  };
});

export default function UploadPage() {
  const [name, setName]       = useState('');
  const [message, setMessage] = useState('');
  const [tag, setTag]         = useState('Memory');
  const [files, setFiles]     = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading]         = useState(false);
  const [fileProgresses, setFileProgresses] = useState([]);
  const [success, setSuccess]             = useState(false);
  const [error, setError]                 = useState('');
  const [dragOver, setDragOver]           = useState(false);
  const fileInputRef = useRef(null);

  const addFiles = useCallback((incoming) => {
    const arr = Array.from(incoming);
    setFiles((prev) => [...prev, ...arr]);
    setPreviews((prev) => [
      ...prev,
      ...arr.map((f) => ({
        id: Math.random().toString(36).slice(2),
        name: f.name,
        type: f.type.startsWith('video') ? 'video' : 'image',
        url: f.type.startsWith('video') ? null : URL.createObjectURL(f),
      })),
    ]);
  }, []);

  const removeFile = (idx) => {
    setFiles((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const resetAll = () => {
    setName(''); setMessage(''); setTag('Memory');
    setFiles([]); setPreviews([]); setFileProgresses([]);
    setSuccess(false); setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (files.length === 0) { setError('Please select at least one photo or video.'); return; }

    setUploading(true);
    setFileProgresses(files.map((f) => ({ name: f.name, progress: 0, status: 'uploading', error: null })));

    const saveName = name.trim() || 'Anonymous Wall-Crawler';

    await Promise.all(
      files.map(async (file, idx) => {
        const setP = (patch) =>
          setFileProgresses((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], ...patch };
            return next;
          });
        try {
          const { url, fileType } = await uploadToCloudinary(file, (p) => setP({ progress: p }));
          await addDoc(collection(db, 'uploads'), {
            name: saveName,
            message: message.trim(),
            tag,
            fileUrl: url,
            fileType,
            createdAt: serverTimestamp(),
            approved: true,
            selected: false,
            used: false,
            downloaded: false,
            downloadedAt: null,
          });
          setP({ status: 'done', progress: 100 });
        } catch (err) {
          setP({ status: 'error', error: err.message });
        }
      })
    );

    setUploading(false);
    setSuccess(true);
  };

  const doneCount  = fileProgresses.filter((f) => f.status === 'done').length;
  const errorCount = fileProgresses.filter((f) => f.status === 'error').length;

  /* ── SUCCESS OVERLAY ─────────────────────────────── */
  if (success) {
    return (
      <div className="up-success-overlay">
        {CONFETTI.map((c) => (
          <div
            key={c.id}
            className="confetti-piece"
            style={{
              left: c.left,
              width: c.size,
              height: c.size,
              background: c.color,
              borderRadius: c.shape,
              animationDelay: c.delay,
            }}
          />
        ))}
        <div className="up-success-card">
          <div className="up-success-emoji">🎉</div>
          <h2>Your memories are on the wall!</h2>
          <p>
            Thanks, <strong>{name.trim() || 'Anonymous Wall-Crawler'}</strong>!<br />
            The batch will treasure these.
          </p>
          {errorCount > 0 && (
            <p className="up-success-warn">
              ⚠️ {errorCount} file{errorCount > 1 ? 's' : ''} failed to upload.
            </p>
          )}
          <button className="up-success-btn" onClick={resetAll}>
            Add More Memories
          </button>
        </div>
      </div>
    );
  }

  /* ── MAIN FORM ───────────────────────────────────── */
  return (
    <div className="up-page">
      <div className="up-container">
        {/* Header */}
        <header className="up-header">
          <span className="up-header__spider">🕷️</span>
          <h1 className="up-header__title">Drop Your Memories Here</h1>
          <p className="up-header__sub">
            No sign-up. No login. Just memories.&nbsp;
            <span className="up-header__anon">Stay anonymous if you want.</span>
          </p>
        </header>

        {/* Form Card */}
        <form className="up-card" onSubmit={handleSubmit} noValidate>

          {/* Name */}
          <div className="up-field">
            <label className="up-label" htmlFor="up-name">
              Your name &nbsp;<span className="up-label__opt">· totally optional 🕶️</span>
            </label>
            <input
              id="up-name"
              className="up-input"
              type="text"
              placeholder="e.g. Peter Parker, or leave blank"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Message */}
          <div className="up-field">
            <label className="up-label" htmlFor="up-msg">Leave a message for the batch</label>
            <div className="up-textarea-wrap">
              <textarea
                id="up-msg"
                className="up-textarea"
                placeholder="With great memories comes great responsibility..."
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 280))}
                rows={3}
                disabled={uploading}
              />
              <span className={`up-char-count ${message.length >= 260 ? 'up-char-count--warn' : ''}`}>
                {message.length} / 280
              </span>
            </div>
          </div>

          {/* Tag */}
          <div className="up-field">
            <label className="up-label">Tag this memory</label>
            <div className="up-tags">
              {TAGS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`up-tag-btn ${tag === t.value ? 'up-tag-btn--active' : ''}`}
                  onClick={() => setTag(t.value)}
                  disabled={uploading}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* File Drop Zone */}
          <div className="up-field">
            <label className="up-label">Photos &amp; Videos</label>
            <div
              className={`up-dropzone ${dragOver ? 'up-dropzone--over' : ''} ${files.length > 0 ? 'up-dropzone--has-files' : ''}`}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
            >
              <span className="up-dropzone__icon">📷</span>
              <p className="up-dropzone__text">Tap to add photos &amp; videos</p>
              <p className="up-dropzone__sub">Select multiple from your gallery</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => addFiles(e.target.files)}
              disabled={uploading}
            />

            {/* Preview strip */}
            {previews.length > 0 && (
              <div className="up-preview-strip-wrap">
                <span className="up-preview-count">
                  {previews.length} file{previews.length > 1 ? 's' : ''} selected
                </span>
                <div className="up-preview-strip">
                  {previews.map((pv, idx) => (
                    <div key={pv.id} className="up-thumb">
                      {pv.type === 'image' ? (
                        <img src={pv.url} alt={pv.name} />
                      ) : (
                        <div className="up-thumb__video">
                          <span>🎬</span>
                          <small>{pv.name.slice(0, 8)}</small>
                        </div>
                      )}
                      {!uploading && (
                        <button
                          type="button"
                          className="up-thumb__remove"
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          aria-label="Remove file"
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && <div className="up-error">⚠️ {error}</div>}

          {/* Submit */}
          <button className="up-submit" type="submit" disabled={uploading}>
            {uploading ? '🕸️ Uploading...' : '🕸️ Send to the Wall'}
          </button>

          {/* Per-file progress */}
          {uploading && fileProgresses.length > 0 && (
            <div className="up-progress-list">
              <p className="up-progress-status">
                Uploading {doneCount} of {fileProgresses.length}... please wait 🕸️
              </p>
              {fileProgresses.map((fp, idx) => (
                <div key={idx} className="up-progress-row">
                  <span className="up-progress-name">
                    {previews[idx]?.type === 'image' && previews[idx]?.url ? (
                      <img src={previews[idx].url} alt="" className="up-progress-thumb" />
                    ) : (
                      <span className="up-progress-thumb up-progress-thumb--video">🎬</span>
                    )}
                    <span>{fp.name.length > 20 ? fp.name.slice(0, 18) + '…' : fp.name}</span>
                  </span>
                  <div className="up-progress-bar-wrap">
                    <div
                      className={`up-progress-bar ${fp.status === 'done' ? 'up-progress-bar--done' : ''} ${fp.status === 'error' ? 'up-progress-bar--error' : ''}`}
                      style={{ width: `${fp.progress}%` }}
                    />
                  </div>
                  <span className={`up-progress-pct ${fp.status === 'done' ? 'up-progress-pct--done' : ''} ${fp.status === 'error' ? 'up-progress-pct--error' : ''}`}>
                    {fp.status === 'done' ? '✓' : fp.status === 'error' ? '✗' : `${fp.progress}%`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </form>

        <p className="up-footer">🕷️ All memories are saved privately and reviewed by the organizer.</p>
      </div>
    </div>
  );
}
