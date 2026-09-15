import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import CustomSelect from './CustomSelect';
import ArtistSideNav from './ArtistSideNav';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from './Toast';
import authFetch from '../utils/authFetch';

const ArtworkForm = ({ mode = 'create', artworkId = null, initialData = null }) => {
  const { user } = useAuth();
  const { compact } = useSidebar();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    type: 'physical',
    category_id: '',
    stock: '',
    tags: [],
    originality_declaration: false,
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [digitalFile, setDigitalFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [dragImageIdx, setDragImageIdx] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCategories().then(() => {
      if (mode === 'edit' && artworkId) {
        fetchArtwork();
      } else {
        setLoading(false);
      }
    });
  }, [artworkId, mode]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/artworks/categories/');
      if (response.ok) setCategories(await response.json());
    } catch (err) { console.error(err); }
  };

  const fetchArtwork = async () => {
    try {
      const response = await authFetch(`/api/artworks/my-artworks/${artworkId}/`);
      if (response.ok) {
        const d = await response.json();
        setFormData({
          title: d.title || '',
          description: d.description || '',
          price: d.price || '',
          type: d.type || 'physical',
          category_id: d.category?.id || '',
          stock: d.stock ?? '',
          tags: (d.tags || []).map(t => t.tag || t),
          originality_declaration: true,
        });
        setExistingImages(d.images || []);
      } else {
        addToast('Artwork not found', 'error');
        navigate('/my-artworks');
      }
    } catch {
      addToast('Failed to load artwork', 'error');
      navigate('/my-artworks');
    } finally {
      setLoading(false);
    }
  };

  const handleImageDrop = useCallback((files) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    const total = images.length + fileArr.length;
    if (total > 5) { setError('Maximum 5 images allowed'); return; }
    setError('');
    setImages(prev => [...prev, ...fileArr]);
    setImagePreviews(prev => [...prev, ...fileArr.map(f => URL.createObjectURL(f))]);
  }, [images.length]);

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); handleImageDrop(e.dataTransfer.files); };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = async (imageId) => {
    try {
      await authFetch(`/api/artworks/my-artworks/${artworkId}/images/${imageId}/`, { method: 'DELETE' });
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch { addToast('Failed to remove image', 'error'); }
  };

  const handleImageDragStart = (idx) => setDragImageIdx(idx);
  const handleImageDragOver = (e, idx) => {
    e.preventDefault();
    if (dragImageIdx === null || dragImageIdx === idx) return;
    const newPreviews = [...imagePreviews];
    const newImages = [...images];
    const [movedPreview] = newPreviews.splice(dragImageIdx, 1);
    const [movedImage] = newImages.splice(dragImageIdx, 1);
    newPreviews.splice(idx, 0, movedPreview);
    newImages.splice(idx, 0, movedImage);
    setImagePreviews(newPreviews);
    setImages(newImages);
    setDragImageIdx(idx);
  };
  const handleImageDragEnd = () => setDragImageIdx(null);

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase();
    if (t && !formData.tags.includes(t)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setTagInput('');
  };
  const removeTag = (tag) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) { setError('Title is required'); return; }
    if (!formData.description.trim()) { setError('Description is required'); return; }
    if (!formData.price || parseFloat(formData.price) <= 0) { setError('Price must be greater than 0'); return; }
    if (!formData.category_id) { setError('Category is required'); return; }
    if (mode === 'create' && images.length === 0) { setError('At least one image is required'); return; }
    if (mode === 'create' && !formData.originality_declaration) { setError('You must declare this is your original work'); return; }
    if (formData.type === 'digital' && mode === 'create' && !digitalFile) { setError('Digital file is required for digital artworks'); return; }

    setSubmitting(true);

    try {
      const artworkData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        type: formData.type,
        category_id: formData.category_id,
        stock: formData.type === 'physical' ? parseInt(formData.stock) || 1 : null,
        tags: formData.tags,
      };

      let artwork;
      if (mode === 'create') {
        setSubmitStep('Creating artwork...');
        artworkData.originality_declaration = formData.originality_declaration;
        const res = await authFetch('/api/artworks/my-artworks/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(artworkData),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to create artwork'); }
        artwork = await res.json();
      } else {
        setSubmitStep('Saving changes...');
        const res = await authFetch(`/api/artworks/my-artworks/${artworkId}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(artworkData),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update artwork'); }
        artwork = await res.json();
      }

      if (mode === 'create' && images.length > 0) {
        setSubmitStep(`Uploading images (0/${images.length})...`);
        for (let i = 0; i < images.length; i++) {
          setSubmitStep(`Uploading images (${i + 1}/${images.length})...`);
          const fd = new FormData();
          fd.append('image', images[i]);
          fd.append('is_primary', i === 0);
          await authFetch(`/api/artworks/my-artworks/${artwork.id}/images/`, { method: 'POST', body: fd });
        }
      }

      if (formData.type === 'digital' && digitalFile && mode === 'create') {
        setSubmitStep('Uploading digital file...');
        const fd = new FormData();
        fd.append('file', digitalFile);
        await authFetch(`/api/artworks/my-artworks/${artwork.id}/digital-file/`, { method: 'POST', body: fd });
      }

      setSubmitStep('Done!');
      addToast(mode === 'create' ? 'Artwork saved as draft. Submit it from My Artworks when ready.' : 'Artwork updated!', 'success');
      navigate('/my-artworks');
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
      addToast(err.message || 'Network error', 'error');
    } finally {
      setSubmitting(false);
      setSubmitStep('');
    }
  };

  if (loading) return <LoadingSpinner label={mode === 'create' ? 'Loading form...' : 'Loading artwork...'} />;

  const isApprovedArtist = user?.artist_profile?.status === 'approved';
  const primaryPreview = imagePreviews[0] || existingImages[0]?.image || null;
  const selectedCategory = categories.find(c => String(c.id) === String(formData.category_id));

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <Header />
      {isApprovedArtist && <ArtistSideNav />}

      <main className={`mx-auto w-full max-w-7xl px-6 py-10 page-enter flex-1 ${isApprovedArtist ? (compact ? 'md:pl-16' : 'md:pl-60 xl:pl-72') : ''}`}>
        {/* Breadcrumb + Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <button onClick={() => navigate('/my-artworks')} className="hover:text-[#9c4327] transition-colors">My Artworks</button>
            <span>/</span>
            <span className="font-medium text-stone-800">{mode === 'create' ? 'Create Artwork' : 'Edit Artwork'}</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900">{mode === 'create' ? 'Create New Artwork' : 'Edit Artwork'}</h1>
          <p className="mt-2 text-stone-500">
            {mode === 'create' ? 'Add your artwork to the marketplace. It will be saved as a draft for review.' : 'Update your artwork details. Changes are reflected immediately.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form — 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Details Card */}
              <div className="rounded-xl border border-stone-200 bg-white p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Title *</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                      placeholder="e.g. Sunset Over Kathmandu" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Description *</label>
                    <textarea rows={5} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                      placeholder="Materials, dimensions, story behind the piece..." required />
                    <p className="mt-1 text-[11px] text-stone-400">{formData.description.length} characters</p>
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="rounded-xl border border-stone-200 bg-white p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Pricing & Type</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Price (NPR) *</label>
                    <div className="flex rounded-lg border border-stone-200 overflow-hidden focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400">
                      <span className="flex items-center px-3 text-sm text-stone-400 bg-stone-50 border-r border-stone-200 font-medium">रू</span>
                      <input type="number" step="1" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent" placeholder="0" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Type *</label>
                    <div className="flex gap-2">
                      {['physical', 'digital'].map(t => (
                        <button key={t} type="button" onClick={() => setFormData({ ...formData, type: t })}
                          className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                            formData.type === t ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                          }`}>
                          {t === 'physical' ? 'Physical' : 'Digital'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Category *</label>
                    <CustomSelect
                      value={formData.category_id}
                      onChange={(val) => setFormData({ ...formData, category_id: val })}
                      placeholder="Select category"
                      options={categories.map(c => ({ value: c.id, label: c.name }))}
                      className="w-full"
                    />
                  </div>
                  {formData.type === 'physical' && (
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">Stock *</label>
                      <input type="number" min="1" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                        placeholder="1" required />
                    </div>
                  )}
                </div>
              </div>

              {/* Images Card */}
              <div className="rounded-xl border border-stone-200 bg-white p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">
                  Images {mode === 'create' ? '* ' : ''}(max 5)
                </h3>

                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                    dragOver ? 'border-stone-500 bg-stone-50' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                  }`}
                >
                  <svg className="h-10 w-10 mx-auto text-stone-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-stone-600 font-medium">Drag & drop images here</p>
                  <p className="text-xs text-stone-400 mt-1">or click to browse. JPG, PNG, WEBP.</p>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                    onChange={(e) => { handleImageDrop(e.target.files); e.target.value = ''; }} />
                </div>

                {/* Image grid */}
                {(existingImages.length > 0 || imagePreviews.length > 0) && (
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {existingImages.map((img, i) => (
                      <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                        <img src={img.image} alt="" className="h-full w-full object-cover" />
                        {i === 0 && <span className="absolute top-1 left-1 text-[8px] bg-black/60 text-white px-1 rounded font-bold">PRIMARY</span>}
                        <button type="button" onClick={() => removeExistingImage(img.id)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ))}
                    {imagePreviews.map((src, i) => (
                      <div key={`new-${i}`} draggable onDragStart={() => handleImageDragStart(i)}
                        onDragOver={(e) => handleImageDragOver(e, i)} onDragEnd={handleImageDragEnd}
                        className={`relative group aspect-square rounded-lg overflow-hidden bg-stone-100 border cursor-grab active:cursor-grabbing ${
                          dragImageIdx === i ? 'border-stone-400 ring-2 ring-stone-300' : 'border-stone-200'
                        }`}>
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        {i === 0 && existingImages.length === 0 && (
                          <span className="absolute top-1 left-1 text-[8px] bg-black/60 text-white px-1 rounded font-bold">PRIMARY</span>
                        )}
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-4 w-4 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {existingImages.length + imagePreviews.length > 0 && (
                  <p className="mt-2 text-[11px] text-stone-400">{existingImages.length + imagePreviews.length}/5 images. Drag to reorder. First image is primary.</p>
                )}
              </div>

              {/* Digital File (conditional) */}
              {formData.type === 'digital' && (
                <div className="rounded-xl border border-stone-200 bg-white p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Digital File {mode === 'create' ? '*' : ''}</h3>
                  <div onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setDigitalFile(f); }}
                    onClick={() => document.getElementById('digital-file-input')?.click()}
                    className="rounded-lg border-2 border-dashed border-stone-200 hover:border-stone-300 p-6 text-center cursor-pointer transition-colors">
                    {digitalFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-left">
                          <p className="text-sm font-medium text-stone-700">{digitalFile.name}</p>
                          <p className="text-xs text-stone-400">{(digitalFile.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setDigitalFile(null); }}
                          className="text-xs text-red-500 hover:text-red-700 ml-2">Remove</button>
                      </div>
                    ) : (
                      <>
                        <svg className="h-8 w-8 mx-auto text-stone-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-stone-600">Drag & drop or click to upload</p>
                        <p className="text-xs text-stone-400 mt-1">ZIP, RAR, PDF, JPG, PNG</p>
                      </>
                    )}
                    <input id="digital-file-input" type="file" accept=".zip,.rar,.pdf,.jpg,.png" className="hidden"
                      onChange={(e) => { if (e.target.files[0]) setDigitalFile(e.target.files[0]); }} />
                  </div>
                </div>
              )}

              {/* Tags Card */}
              <div className="rounded-xl border border-stone-200 bg-white p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-stone-900 text-white px-3 py-1 text-xs font-medium">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-stone-300 transition-colors">×</button>
                    </span>
                  ))}
                </div>
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                  onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                  className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                  placeholder={formData.tags.length === 0 ? 'Type a tag and press Enter...' : 'Add another tag...'} />
                <p className="mt-1.5 text-[11px] text-stone-400">Press Enter or comma to add. Helps buyers find your work.</p>
              </div>

              {/* Declaration */}
              {mode === 'create' && (
                <div className="rounded-xl border border-stone-200 bg-white p-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.originality_declaration}
                      onChange={(e) => setFormData({ ...formData, originality_declaration: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400" />
                    <span className="text-sm text-stone-700">I confirm that this artwork is my original creation and I have the right to sell it on Artisa.</span>
                  </label>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2">
                  <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-stone-200">
                <button type="button" onClick={() => navigate('/my-artworks')}
                  className="w-full sm:w-auto rounded-lg border border-stone-200 bg-white px-6 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="w-full sm:w-auto rounded-lg bg-[#000] px-8 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      {submitStep || 'Submitting...'}
                    </>
                  ) : (
                    <>{mode === 'create' ? 'Create Artwork →' : 'Save Changes'}</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preview — 1 col */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Preview</h3>
              <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                {/* Image */}
                <div className="aspect-square bg-stone-100 relative">
                  {primaryPreview ? (
                    <img src={primaryPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-stone-300">
                      <svg className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/85 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      <span className={`h-1.5 w-1.5 rounded-full ${formData.type === 'physical' ? 'bg-[#9c4327]' : 'bg-stone-500'}`} />
                      {formData.type === 'physical' ? 'Physical' : 'Digital'}
                    </span>
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <h4 className="font-semibold text-stone-900 text-sm line-clamp-1 font-heading">
                    {formData.title || 'Artwork title'}
                  </h4>
                  {selectedCategory && (
                    <p className="text-[11px] text-stone-400 mt-0.5">{selectedCategory.name}</p>
                  )}
                  <p className="text-sm font-bold text-[#9c4327] mt-1.5">
                    {formData.price ? `रू ${Number(formData.price).toLocaleString()}` : 'रू —'}
                  </p>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.tags.slice(0, 4).map(t => (
                        <span key={t} className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500">{t}</span>
                      ))}
                      {formData.tags.length > 4 && <span className="text-[10px] text-stone-400">+{formData.tags.length - 4}</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-stone-100">
                    <div className="h-5 w-5 rounded-full bg-stone-200 overflow-hidden">
                      {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <span className="text-[11px] text-stone-500">{user?.username}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArtworkForm;
