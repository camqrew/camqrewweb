import React, { useState, useEffect, useMemo } from 'react';
import { vaultApi } from '../api/vaultApi';
import type { VaultFolder, VaultFile } from '../types/vault';
import type { Booking } from '../types/booking';
import { 
  X, 
  Check, 
  Star, 
  MessageSquare, 
  UploadCloud, 
  Download, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  AlertCircle
} from 'lucide-react';

interface PhotoProofingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  currentUserId?: string;
  isClientView?: boolean;
  onMilestoneReleased?: () => void;
}

export const PhotoProofingModal: React.FC<PhotoProofingModalProps> = ({
  isOpen,
  onClose,
  booking,
  currentUserId,
  isClientView: _isClientView = false,
  onMilestoneReleased,
}) => {
  const [folder, setFolder] = useState<VaultFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'selected' | 'commented'>('all');
  
  // Lightbox view
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // Upload dialog state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploading, setUploading] = useState(false);

  // Approval confirmation modal
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  // Max selections edit
  const [editingLimit, setEditingLimit] = useState(false);
  const [newLimit, setNewLimit] = useState(100);

  useEffect(() => {
    if (isOpen && booking?.id) {
      loadGallery();
    }
  }, [isOpen, booking?.id]);

  const loadGallery = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vaultApi.getGalleryForBooking(booking.id);
      setFolder(data);
      setNewLimit(data.maxSelections || 100);
    } catch (err: any) {
      setError(err.message || 'Failed to load proof gallery.');
    } finally {
      setLoading(false);
    }
  };

  const files = folder?.files || [];
  const selectedFiles = useMemo(() => files.filter(f => f.isSelected), [files]);
  const commentedFiles = useMemo(() => files.filter(f => f.clientComment && f.clientComment.trim().length > 0), [files]);

  const filteredFiles = useMemo(() => {
    if (activeFilter === 'selected') return selectedFiles;
    if (activeFilter === 'commented') return commentedFiles;
    return files;
  }, [files, activeFilter, selectedFiles, commentedFiles]);

  const handleToggleStar = async (file: VaultFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (folder?.status === 'approved') return; // Locked once approved

    const nextState = !file.isSelected;
    // Optimistic update
    setFolder(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        files: prev.files.map(f => f.id === file.id ? { ...f, isSelected: nextState } : f),
      };
    });

    try {
      await vaultApi.togglePhotoSelection(file.id, nextState);
    } catch (err) {
      // Revert on error
      setFolder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          files: prev.files.map(f => f.id === file.id ? { ...f, isSelected: !nextState } : f),
        };
      });
    }
  };

  const handleSaveComment = async () => {
    if (activePhotoIndex === null) return;
    const currentPhoto = filteredFiles[activePhotoIndex];
    if (!currentPhoto) return;

    setSavingComment(true);
    try {
      await vaultApi.updatePhotoComment(currentPhoto.id, editingComment);
      setFolder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          files: prev.files.map(f => f.id === currentPhoto.id ? { ...f, clientComment: editingComment } : f),
        };
      });
    } catch (err: any) {
      alert('Failed to save comment: ' + err.message);
    } finally {
      setSavingComment(false);
    }
  };

  const handleApproveGallery = async () => {
    if (!folder) return;
    setApproving(true);
    try {
      await vaultApi.approveAlbumSelection(folder.id, booking.id);
      setApprovalSuccess(true);
      setShowApproveConfirm(false);
      await loadGallery();
      if (onMilestoneReleased) onMilestoneReleased();
    } catch (err: any) {
      alert('Failed to approve album selection: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleUploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim() || !folder) return;

    setUploading(true);
    try {
      const fileName = uploadName.trim() || `Proof_${Date.now()}.jpg`;
      const newFile = await vaultApi.uploadProofPhoto(folder.id, currentUserId || 'creator', {
        fileName,
        fileUrl: uploadUrl.trim(),
        fileSize: 3400000,
      });

      setFolder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          files: [...prev.files, newFile],
        };
      });

      setUploadUrl('');
      setUploadName('');
      setShowUploadModal(false);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddSamplePhotos = async () => {
    if (!folder) return;
    setUploading(true);
    try {
      const samples = [
        { name: 'Candid_Ceremony_01.jpg', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200' },
        { name: 'Bridal_Portrait_02.jpg', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200' },
        { name: 'Mandap_Rituals_03.jpg', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200' },
        { name: 'Couple_GoldenHour_04.jpg', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200' },
        { name: 'Haldi_Celebration_05.jpg', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=1200' },
        { name: 'Reception_Stage_06.jpg', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1200' },
      ];

      for (const sample of samples) {
        await vaultApi.uploadProofPhoto(folder.id, currentUserId || 'creator', {
          fileName: sample.name,
          fileUrl: sample.url,
          fileSize: 4200000,
        });
      }

      await loadGallery();
      setShowUploadModal(false);
    } catch (err: any) {
      alert('Failed to insert sample photos: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExportSelection = () => {
    if (selectedFiles.length === 0) {
      alert('No photos currently selected.');
      return;
    }

    const lines = [
      `CAMQREW VAULT — ALBUM SELECTION EXPORT`,
      `Shoot: ${booking.serviceTitle}`,
      `Client: ${booking.customerName} | Creator: ${booking.professionalName}`,
      `Date: ${new Date().toLocaleDateString('en-IN')}`,
      `Total Selected: ${selectedFiles.length} / ${folder?.maxSelections || 100}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      ...selectedFiles.map((f, i) => `${i + 1}. ${f.fileName} ${f.clientComment ? `— Notes: "${f.clientComment}"` : ''}`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Album_Selection_${booking.serviceTitle.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveLimit = async () => {
    if (!folder) return;
    try {
      await vaultApi.updateGallerySettings(folder.id, { maxSelections: newLimit });
      setFolder(prev => prev ? { ...prev, maxSelections: newLimit } : prev);
      setEditingLimit(false);
    } catch (err: any) {
      alert('Failed to update limit: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-container proofing-modal-container card" 
        onClick={e => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: 1280,
          maxHeight: '94vh',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 16,
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Top Navigation Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-elevated)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Camqrew Vault • Photo Proofing Gallery
              </h2>
              {folder?.status === 'approved' ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800,
                  background: 'rgba(63, 182, 104, 0.15)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent)',
                }}>
                  <CheckCircle size={12} /> ALBUM APPROVED & ESCROW RELEASED
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  border: '1px solid #f59e0b',
                }}>
                  SELECTION IN PROGRESS
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {booking.serviceTitle} • Client: <strong>{booking.customerName}</strong> • Pro: <strong>{booking.professionalName}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Pro controls */}
            <button 
              className="btn btn-outline btn-sm"
              onClick={handleExportSelection}
              disabled={selectedFiles.length === 0}
              title="Download selected filenames list for Lightroom/print"
            >
              <Download size={14} /> Export List ({selectedFiles.length})
            </button>

            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setShowUploadModal(true)}
            >
              <UploadCloud size={14} /> + Upload Proofs
            </button>

            {/* Client Approval CTA */}
            {folder?.status !== 'approved' && (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowApproveConfirm(true)}
                style={{
                  background: 'var(--accent)',
                  color: '#ffffff',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Check size={16} /> Approve Album Selection
              </button>
            )}

            <button 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 6,
                display: 'flex',
                borderRadius: 6,
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Counter & Progress Banner */}
        <div style={{
          padding: '12px 24px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          {/* Counter Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              <Star size={15} color="#eab308" fill="#eab308" />
              <span>
                Selected: <strong style={{ color: 'var(--accent)' }}>{selectedFiles.length}</strong> / {folder?.maxSelections || 100} for Album
              </span>
            </div>

            {/* Limit change for creator */}
            {!editingLimit ? (
              <button 
                onClick={() => setEditingLimit(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Change Limit
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input 
                  type="number"
                  value={newLimit}
                  onChange={e => setNewLimit(Number(e.target.value))}
                  style={{
                    width: 70,
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                  }}
                  min={1}
                />
                <button className="btn btn-primary btn-xs" onClick={handleSaveLimit}>Save</button>
                <button className="btn btn-outline btn-xs" onClick={() => setEditingLimit(false)}>Cancel</button>
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '6px 14px',
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeFilter === 'all' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: activeFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              All Photos ({files.length})
            </button>
            <button
              onClick={() => setActiveFilter('selected')}
              style={{
                padding: '6px 14px',
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeFilter === 'selected' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: activeFilter === 'selected' ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              ⭐ Selected ({selectedFiles.length})
            </button>
            <button
              onClick={() => setActiveFilter('commented')}
              style={{
                padding: '6px 14px',
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeFilter === 'commented' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: activeFilter === 'commented' ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              💬 With Feedback ({commentedFiles.length})
            </button>
          </div>
        </div>

        {/* Success Banner if approved */}
        {approvalSuccess && (
          <div style={{
            background: 'rgba(63, 182, 104, 0.12)',
            borderBottom: '1px solid var(--accent)',
            padding: '12px 24px',
            color: 'var(--accent)',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <CheckCircle size={16} /> Album Selection Approved! The 30% Final Deliverables Escrow has been automatically released to the creator.
          </div>
        )}

        {/* Gallery Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <Loader2 size={32} className="animate-spin" color="var(--accent)" />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading proofing gallery...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#ef4444' }}>{error}</p>
              <button className="btn btn-outline btn-sm" onClick={loadGallery} style={{ marginTop: 12 }}>Retry</button>
            </div>
          ) : files.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              border: '2px dashed var(--border-color)',
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.01)',
              maxWidth: 600,
              margin: '40px auto',
            }}>
              <UploadCloud size={48} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                No Proof Photos Uploaded Yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 20px' }}>
                Photographers upload shoot raw/preview files here so clients can star favorite shots for album printing and leave pin-point feedback.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                  + Upload Proof Photos
                </button>
                <button className="btn btn-outline" onClick={handleAddSamplePhotos}>
                  Load Demo Shoot Pack
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
            }}>
              {filteredFiles.map((file, idx) => (
                <div 
                  key={file.id}
                  onClick={() => {
                    setActivePhotoIndex(idx);
                    setEditingComment(file.clientComment || '');
                  }}
                  style={{
                    position: 'relative',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'var(--bg-elevated)',
                    border: file.isSelected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                    boxShadow: 'none',
                  }}
                >
                  {/* Photo Container */}
                  <div style={{ position: 'relative', width: '100%', height: 200, backgroundColor: '#000' }}>
                    <img 
                      src={file.fileUrl} 
                      alt={file.fileName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      loading="lazy"
                    />

                    {/* Watermark Diagonal Overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        transform: 'rotate(-30deg)',
                        color: 'rgba(255, 255, 255, 0.38)',
                        fontSize: 14,
                        fontWeight: 900,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        padding: '4px 16px',
                        borderRadius: 4,
                        background: 'rgba(0, 0, 0, 0.25)',
                        whiteSpace: 'nowrap',
                      }}>
                        {file.watermarkText || 'CAMQREW PROOF'}
                      </div>
                    </div>

                    {/* Star / Select Button Top Left */}
                    <button
                      onClick={(e) => handleToggleStar(file, e)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: file.isSelected ? '#eab308' : 'rgba(0, 0, 0, 0.65)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 34,
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                      }}
                      title={file.isSelected ? 'Unselect from album' : 'Select for album'}
                    >
                      <Star 
                        size={16} 
                        color={file.isSelected ? '#000000' : '#ffffff'} 
                        fill={file.isSelected ? '#000000' : 'none'} 
                      />
                    </button>

                    {/* Comment Indicator Bottom Left */}
                    {file.clientComment && (
                      <div style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        background: 'rgba(0, 0, 0, 0.75)',
                        color: '#38bdf8',
                        borderRadius: 14,
                        padding: '3px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                      }}>
                        <MessageSquare size={12} /> Notes
                      </div>
                    )}
                  </div>

                  {/* Photo Details Footer */}
                  <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {file.fileName}
                    </span>
                    {file.isSelected ? (
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)' }}>
                        ✓ SELECTED
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Proof
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── LIGHTBOX MODAL / PHOTO INSPECTOR ── */}
        {activePhotoIndex !== null && filteredFiles[activePhotoIndex] && (() => {
          const current = filteredFiles[activePhotoIndex];
          return (
            <div 
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10005,
                background: 'rgba(0, 0, 0, 0.92)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={() => setActivePhotoIndex(null)}
            >
              {/* Lightbox Header */}
              <div 
                style={{
                  padding: '14px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(20, 20, 20, 0.8)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <button 
                    onClick={() => handleToggleStar(current)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: current.isSelected ? '#eab308' : 'rgba(255, 255, 255, 0.1)',
                      color: current.isSelected ? '#000000' : '#ffffff',
                      border: 'none',
                      borderRadius: 20,
                      padding: '6px 14px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Star size={15} fill={current.isSelected ? '#000000' : 'none'} color={current.isSelected ? '#000000' : '#ffffff'} />
                    {current.isSelected ? 'Starred for Album' : 'Select for Album'}
                  </button>
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{current.fileName}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                    ({activePhotoIndex + 1} of {filteredFiles.length})
                  </span>
                </div>

                <button 
                  onClick={() => setActivePhotoIndex(null)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 6 }}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Lightbox Body with Center Image & Side Notes */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                {/* Image Viewport */}
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <img 
                    src={current.fileUrl} 
                    alt={current.fileName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: 8,
                    }}
                  />

                  {/* Watermark in Lightbox */}
                  <div style={{
                    position: 'absolute',
                    pointerEvents: 'none',
                    transform: 'rotate(-25deg)',
                    color: 'rgba(255, 255, 255, 0.35)',
                    fontSize: 24,
                    fontWeight: 900,
                    letterSpacing: 4,
                    border: '2px solid rgba(255, 255, 255, 0.25)',
                    padding: '8px 28px',
                    borderRadius: 6,
                    background: 'rgba(0, 0, 0, 0.35)',
                    textTransform: 'uppercase',
                  }}>
                    {current.watermarkText || 'CAMQREW PROOF • DO NOT PRINT'}
                  </div>

                  {/* Prev Button */}
                  {activePhotoIndex > 0 && (
                    <button
                      onClick={() => {
                        const prevIdx = activePhotoIndex - 1;
                        setActivePhotoIndex(prevIdx);
                        setEditingComment(filteredFiles[prevIdx]?.clientComment || '');
                      }}
                      style={{
                        position: 'absolute',
                        left: 20,
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                  )}

                  {/* Next Button */}
                  {activePhotoIndex < filteredFiles.length - 1 && (
                    <button
                      onClick={() => {
                        const nextIdx = activePhotoIndex + 1;
                        setActivePhotoIndex(nextIdx);
                        setEditingComment(filteredFiles[nextIdx]?.clientComment || '');
                      }}
                      style={{
                        position: 'absolute',
                        right: 20,
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <ChevronRight size={24} />
                    </button>
                  )}
                </div>

                {/* Right Feedback Panel */}
                <div style={{
                  width: 320,
                  background: 'rgba(24, 24, 27, 0.95)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={16} color="var(--accent)" />
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>Pin-Point Photo Notes</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                    Leave retouching requests, crop notes, or album placement instructions for the editor.
                  </p>

                  <textarea
                    rows={5}
                    value={editingComment}
                    onChange={e => setEditingComment(e.target.value)}
                    placeholder="e.g. Please color correct skin tones, remove light glare on glasses, or convert to B&W..."
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      padding: 10,
                      color: '#fff',
                      fontSize: 13,
                      resize: 'none',
                    }}
                  />

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveComment}
                    disabled={savingComment}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {savingComment ? <Loader2 size={14} className="animate-spin" /> : 'Save Feedback'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── APPROVAL CONFIRMATION MODAL ── */}
        {showApproveConfirm && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10010,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setShowApproveConfirm(false)}
          >
            <div 
              className="card"
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: 480,
                width: '100%',
                padding: 24,
                borderRadius: 16,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <CheckCircle size={24} color="var(--accent)" />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Approve Album Selection?
                </h3>
              </div>

              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                You have selected <strong style={{ color: 'var(--accent)' }}>{selectedFiles.length} photos</strong> for your printed album.
              </p>

              <div style={{
                background: 'rgba(63, 182, 104, 0.08)',
                border: '1px solid var(--accent)',
                borderRadius: 10,
                padding: 14,
                marginBottom: 20,
                fontSize: 13,
                color: 'var(--text-primary)',
              }}>
                <strong>Escrow Release Notice:</strong>
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: 12 }}>
                  Approving will finalize your selection and automatically release the final <strong>30% Deliverables Escrow</strong> payment to <strong>{booking.professionalName}</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowApproveConfirm(false)}
                  disabled={approving}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleApproveGallery}
                  disabled={approving}
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  {approving ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Release Escrow'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── UPLOAD MODAL ── */}
        {showUploadModal && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10010,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setShowUploadModal(false)}
          >
            <div 
              className="card"
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: 480,
                width: '100%',
                padding: 24,
                borderRadius: 16,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Upload Proof Photos
                </h3>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUploadPhoto}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Photo URL / Cloud Storage Link</label>
                  <input 
                    type="url"
                    className="input-field"
                    placeholder="https://..."
                    value={uploadUrl}
                    onChange={e => setUploadUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>File Label / Frame Code</label>
                  <input 
                    type="text"
                    className="input-field"
                    placeholder="e.g. Sangeet_Couple_08.jpg"
                    value={uploadName}
                    onChange={e => setUploadName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                  <button 
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleAddSamplePhotos}
                    disabled={uploading}
                  >
                    + Load 6 Demo Photos
                  </button>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowUploadModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={uploading || !uploadUrl.trim()}
                    >
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : 'Upload Photo'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
