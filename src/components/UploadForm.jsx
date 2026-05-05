import React, { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { uploadToCloudinary } from "../utils/uploadFile";
import "./UploadForm.css";

const TAGS = ["Memory", "Funny", "Emotional", "Group", "Other"];

export default function UploadForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [tag, setTag] = useState("Memory");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setFilePreview({ url, type: selected.type.startsWith("video") ? "video" : "image" });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    setFile(dropped);
    const url = URL.createObjectURL(dropped);
    setFilePreview({ url, type: dropped.type.startsWith("video") ? "video" : "image" });
  };

  const resetForm = () => {
    setName("");
    setMessage("");
    setTag("Memory");
    setFile(null);
    setFilePreview(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!file) {
      setError("Please select a photo or video.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const { url, fileType } = await uploadToCloudinary(file, (p) => setProgress(p));

      await addDoc(collection(db, "uploads"), {
        name: name.trim(),
        message: message.trim(),
        tag,
        fileUrl: url,
        fileType,
        createdAt: serverTimestamp(),
        approved: true,
        selected: false,
      });

      setSuccess(true);
      setUploading(false);

      setTimeout(() => {
        setSuccess(false);
        resetForm();
      }, 3000);
    } catch (err) {
      setUploading(false);
      setError(err.message || "Something went wrong. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="success-state">
        <div className="success-icon">🎉</div>
        <h2>Your memory has been saved!</h2>
        <p>Thank you for sharing this beautiful moment with the batch.</p>
        <div className="success-sparkles">✨ 💛 ✨</div>
      </div>
    );
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit} noValidate>
      {/* Name */}
      <div className="form-group">
        <label htmlFor="uploader-name">Your Name <span className="required">*</span></label>
        <input
          id="uploader-name"
          type="text"
          placeholder="What should we call you?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={uploading}
          autoComplete="name"
        />
      </div>

      {/* Message */}
      <div className="form-group">
        <label htmlFor="uploader-message">Message to the Batch <span className="optional">(optional)</span></label>
        <textarea
          id="uploader-message"
          placeholder="Share a memory, a wish, or a heartfelt goodbye..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={uploading}
          rows={4}
        />
      </div>

      {/* Tag */}
      <div className="form-group">
        <label htmlFor="uploader-tag">Tag this Memory</label>
        <div className="tag-selector">
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              className={`tag-btn ${tag === t ? "tag-btn--active" : ""}`}
              onClick={() => setTag(t)}
              disabled={uploading}
            >
              {t === "Memory" && "📸 "}
              {t === "Funny" && "😂 "}
              {t === "Emotional" && "🥹 "}
              {t === "Group" && "👥 "}
              {t === "Other" && "💫 "}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* File Drop Zone */}
      <div className="form-group">
        <label>Your Photo or Video <span className="required">*</span></label>
        <div
          className={`drop-zone ${filePreview ? "drop-zone--has-file" : ""}`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {filePreview ? (
            <div className="file-preview">
              {filePreview.type === "image" ? (
                <img src={filePreview.url} alt="Preview" />
              ) : (
                <video src={filePreview.url} controls muted />
              )}
              {!uploading && (
                <button
                  type="button"
                  className="remove-file"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setFilePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  ✕ Remove
                </button>
              )}
            </div>
          ) : (
            <div className="drop-zone-placeholder">
              <span className="drop-icon">📁</span>
              <p>Drop your photo or video here</p>
              <span className="drop-sub">or click to browse</span>
              <span className="drop-types">Images & Videos supported</span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
          disabled={uploading}
          id="file-picker"
        />
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="progress-wrap">
          <div className="progress-label">
            <span>Uploading your memory...</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="form-error" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="submit-btn"
        disabled={uploading}
      >
        {uploading ? (
          <span className="btn-loading">
            <span className="spinner-small"></span> Saving Memory...
          </span>
        ) : (
          "💛 Share My Memory"
        )}
      </button>
    </form>
  );
}
