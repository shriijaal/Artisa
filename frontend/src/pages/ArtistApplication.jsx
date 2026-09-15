import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import authFetch from '../utils/authFetch';

const STEPS = ['About You', 'Portfolio', 'Details', 'Review'];

const ArtistApplication = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    reason: '',
    portfolio_samples: [],
    bio: '',
    specialties: [],
    social_links: {
      instagram: '',
      website: '',
      facebook: '',
      twitter: '',
    },
    verification_document: null,
  });

  const [previews, setPreviews] = useState([]);
  const [verificationPreview, setVerificationPreview] = useState(null);

  useEffect(() => {
    fetchApplication();
    fetchCategories();
  }, []);

  const fetchApplication = async () => {
    try {
      const response = await authFetch('/api/auth/artist/application/');
      if (response.ok) {
        const data = await response.json();
        setApplication(data);
      }
    } catch (err) {
      console.error('Error fetching application:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/artworks/categories/');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleFiles = useCallback((files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newPreviews = imageFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setFormData(prev => ({
      ...prev,
      portfolio_samples: [...prev.portfolio_samples, ...imageFiles],
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
  }, []);

  const removePreview = (index) => {
    URL.revokeObjectURL(previews[index].url);
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      portfolio_samples: prev.portfolio_samples.filter((_, i) => i !== index),
    }));
  };

  const handleVerificationFile = (file) => {
    if (file) {
      setFormData(prev => ({ ...prev, verification_document: file }));
      setVerificationPreview(file.name);
    }
  };

  const removeVerification = () => {
    setFormData(prev => ({ ...prev, verification_document: null }));
    setVerificationPreview(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const toggleSpecialty = (catId) => {
    setFormData(prev => {
      const specialties = prev.specialties.includes(catId)
        ? prev.specialties.filter(id => id !== catId)
        : [...prev.specialties, catId];
      return { ...prev, specialties };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Step 1: Upload portfolio files to get URLs
      const portfolioFormData = new FormData();
      for (let i = 0; i < formData.portfolio_samples.length; i++) {
        portfolioFormData.append('portfolio_samples', formData.portfolio_samples[i]);
      }

      const uploadRes = await authFetch('/api/auth/artist/portfolio/upload/', {
        method: 'POST',
        body: portfolioFormData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        addToast(err.error || 'Failed to upload portfolio images', 'error');
        setSubmitting(false);
        return;
      }

      const { urls } = await uploadRes.json();

      // Step 2: Submit application with URLs
      const appFormData = new FormData();
      appFormData.append('reason', formData.reason);
      appFormData.append('bio', formData.bio);
      appFormData.append('specialties', JSON.stringify(formData.specialties));
      appFormData.append('social_links', JSON.stringify(formData.social_links));
      appFormData.append('portfolio_samples', JSON.stringify(urls));

      if (formData.verification_document) {
        appFormData.append('verification_document', formData.verification_document);
      }

      const response = await authFetch('/api/auth/artist/application/', {
        method: 'POST',
        body: appFormData,
      });

      if (response.ok) {
        const data = await response.json();
        setApplication(data);
        addToast('Application submitted successfully!', 'success');
      } else {
        const err = await response.json();
        addToast(err.error || 'Failed to submit application', 'error');
      }
    } catch (err) {
      addToast('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading application..." />;
  }

  if (application) {
    return <ApplicationStatus application={application} onBack={() => navigate('/settings/account')} />;
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10 page-enter">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <button onClick={() => navigate('/settings/account')} className="hover:text-[#9c4327] transition-colors">Profile Settings</button>
            <span>/</span>
            <span className="font-medium text-stone-800">Artist Application</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Become an Artist</h1>
          <p className="mt-2 text-stone-500">Tell us about yourself and your work. This helps us review your application faster.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                  i < step ? 'bg-[#9c4327] text-white' :
                  i === step ? 'bg-stone-900 text-white' :
                  'bg-stone-200 text-stone-500'
                }`}>
                  {i < step ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`ml-2 text-sm font-medium hidden sm:block ${i <= step ? 'text-stone-900' : 'text-stone-400'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-20 h-0.5 mx-3 ${i < step ? 'bg-[#9c4327]' : 'bg-stone-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8">
          {step === 0 && (
            <StepReason formData={formData} setFormData={setFormData} />
          )}
          {step === 1 && (
            <StepPortfolio
              previews={previews}
              dragActive={dragActive}
              onDrop={handleDrop}
              onDrag={handleDrag}
              onRemove={removePreview}
              onFiles={handleFiles}
              fileInputRef={fileInputRef}
              verificationPreview={verificationPreview}
              onVerification={handleVerificationFile}
              onRemoveVerification={removeVerification}
            />
          )}
          {step === 2 && (
            <StepDetails
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              toggleSpecialty={toggleSpecialty}
            />
          )}
          {step === 3 && (
            <StepReview formData={formData} categories={categories} previews={previews} />
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="px-5 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed(step, formData)}
                className="px-6 py-2.5 rounded-lg bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-[#9c4327] text-sm font-semibold text-white hover:bg-[#7a3520] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Application →'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

function canProceed(step, formData) {
  if (step === 0) return formData.reason.trim().length >= 20;
  if (step === 1) return formData.portfolio_samples.length >= 3;
  return true;
}

function StepReason({ formData, setFormData }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">Why Artisa?</h2>
      <p className="mt-2 text-sm text-stone-500">Tell us about your artistic journey and what you hope to achieve on Artisa.</p>
      <div className="mt-6">
        <textarea
          rows={6}
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none"
          placeholder="I'm a traditional Thangka painter from Bhaktapur. I've been painting for 12 years and want to reach a wider audience. Artisa seems like the perfect platform to connect with art lovers who appreciate Nepali craftsmanship..."
        />
        <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
          <span>{formData.reason.length} characters</span>
          <span className={formData.reason.trim().length >= 20 ? 'text-emerald-500' : ''}>
            {formData.reason.trim().length >= 20 ? '✓ Good' : 'Min 20 characters'}
          </span>
        </div>
      </div>
    </div>
  );
}

function StepPortfolio({ previews, dragActive, onDrop, onDrag, onRemove, onFiles, fileInputRef, verificationPreview, onVerification, onRemoveVerification }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">Portfolio Samples</h2>
      <p className="mt-2 text-sm text-stone-500">Upload 3-5 of your best artworks. First image becomes your cover.</p>

      <div
        onDrop={onDrop}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-6 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-[#9c4327] bg-[#9c4327]/5' : 'border-stone-200 hover:border-stone-300'
        }`}
      >
        <svg className="w-10 h-10 mx-auto text-stone-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm font-medium text-stone-600">Drop images here or click to browse</p>
        <p className="mt-1 text-xs text-stone-400">PNG, JPG, WEBP — Max 5MB each</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => onFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {previews.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-stone-700">{previews.length} image{previews.length !== 1 ? 's' : ''} uploaded</p>
            <span className={`text-xs font-medium ${previews.length >= 3 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {previews.length >= 3 ? '✓ Minimum met' : `Need ${3 - previews.length} more`}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {previews.map((p, i) => (
              <div key={i} className="group relative aspect-square rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                    className="p-1.5 rounded-full bg-white/90 text-stone-600 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 text-[10px] font-semibold bg-stone-900 text-white rounded-full">Cover</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-stone-100">
        <label className="block text-sm font-medium text-stone-700 mb-1">Verification Document (Optional)</label>
        <p className="text-xs text-stone-400 mb-3">Upload ID or portfolio proof for verification badge. Admin-only access.</p>
        {verificationPreview ? (
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="text-sm text-stone-700 flex-1 truncate">{verificationPreview}</span>
            <button type="button" onClick={onRemoveVerification} className="text-xs text-red-500 hover:text-red-700">Remove</button>
          </div>
        ) : (
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => onVerification(e.target.files[0])}
            className="w-full text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-stone-100 file:text-stone-600 hover:file:bg-stone-200"
          />
        )}
      </div>
    </div>
  );
}

function StepDetails({ formData, setFormData, categories, toggleSpecialty }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">Artist Details</h2>
      <p className="mt-2 text-sm text-stone-500">Help buyers discover you. These details will appear on your artist profile.</p>

      {/* Bio */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-stone-700 mb-1">Bio</label>
        <textarea
          rows={4}
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none"
          placeholder="A short bio about yourself — your medium, style, and what inspires you..."
        />
        <p className="mt-1 text-xs text-stone-400">This will be shown on your public profile.</p>
      </div>

      {/* Specialties */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-stone-700 mb-1">Specialties</label>
        <p className="text-xs text-stone-400 mb-3">Select the categories you work in.</p>
        <div className="flex flex-wrap gap-2">
          {categories.filter(c => !c.parent).map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleSpecialty(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                formData.specialties.includes(cat.id)
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-stone-700 mb-1">Social Links (Optional)</label>
        <p className="text-xs text-stone-400 mb-3">Help buyers find more of your work.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'instagram', label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
            { key: 'website', label: 'Website', icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418' },
            { key: 'facebook', label: 'Facebook', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
            { key: 'twitter', label: 'Twitter / X', icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
          ].map(({ key, label, icon }) => (
            <div key={key} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
              <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              <input
                type="url"
                placeholder={label}
                value={formData.social_links[key]}
                onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, [key]: e.target.value } })}
                className="flex-1 text-sm text-stone-900 placeholder-stone-300 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepReview({ formData, categories, previews }) {
  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || id;
  return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">Review Your Application</h2>
      <p className="mt-2 text-sm text-stone-500">Double-check everything before submitting.</p>

      <div className="mt-6 space-y-6">
        {/* Reason */}
        <div className="p-4 rounded-lg bg-stone-50">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Why Artisa?</h3>
          <p className="text-sm text-stone-700 whitespace-pre-wrap">{formData.reason}</p>
        </div>

        {/* Portfolio */}
        <div className="p-4 rounded-lg bg-stone-50">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Portfolio ({previews.length} images)</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {previews.map((p, i) => (
              <div key={i} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-stone-200">
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute bottom-0.5 left-0.5 px-1 text-[8px] font-bold bg-stone-900 text-white rounded">Cover</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        {formData.bio && (
          <div className="p-4 rounded-lg bg-stone-50">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Bio</h3>
            <p className="text-sm text-stone-700 whitespace-pre-wrap">{formData.bio}</p>
          </div>
        )}

        {/* Specialties */}
        {formData.specialties.length > 0 && (
          <div className="p-4 rounded-lg bg-stone-50">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Specialties</h3>
            <div className="flex flex-wrap gap-1.5">
              {formData.specialties.map(id => (
                <span key={id} className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-200 text-stone-700">
                  {getCategoryName(id)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {Object.values(formData.social_links).some(v => v) && (
          <div className="p-4 rounded-lg bg-stone-50">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Social Links</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(formData.social_links).filter(([, v]) => v).map(([key, url]) => (
                <span key={key} className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-200 text-stone-700 capitalize">
                  {key}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationStatus({ application, onBack }) {
  const navigate = useNavigate();
  const [clearing, setClearing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [openSections, setOpenSections] = useState({ reason: true, bio: false, portfolio: true, details: false });

  useEffect(() => {
    fetch('/api/artworks/categories/')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(data))
      .catch(() => {});
  }, []);

  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : `#${id}`;
  };

  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handleReapply = async () => {
    setClearing(true);
    try {
      await authFetch('/api/auth/artist/application/', {
        method: 'DELETE',
      });
    } catch {}
    navigate('/artist-application');
  };

  const submittedDate = application.created_at
    ? new Date(application.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const reviewedDate = application.reviewed_at
    ? new Date(application.reviewed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-10 page-enter">
        <div className="mb-8">
          <button onClick={onBack} className="text-sm text-stone-500 hover:text-[#9c4327] transition-colors mb-3">← Back to Settings</button>
          <h1 className="text-3xl font-bold text-stone-900">Artist Application</h1>
        </div>

        {/* ── REJECTED ── */}
        {application.status === 'rejected' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left — Feedback */}
            <div className="lg:col-span-2 space-y-5">
              {/* Rejection header */}
              <div className="rounded-xl border border-red-200 bg-white overflow-hidden">
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-red-900">Application Not Approved</h2>
                    {reviewedDate && <p className="text-xs text-red-600 mt-0.5">Reviewed {reviewedDate}</p>}
                  </div>
                </div>
                <div className="p-6">
                  {application.rejection_reason ? (
                    <p className="text-sm text-stone-700 leading-relaxed">{application.rejection_reason}</p>
                  ) : (
                    <p className="text-sm text-stone-500 italic">No specific reason provided.</p>
                  )}
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-xl border border-stone-200 bg-white p-6">
                <h3 className="text-sm font-bold text-stone-900 mb-3">Tips for Reapplying</h3>
                <ul className="space-y-2.5">
                  {[
                    'Ensure your portfolio shows a consistent artistic style',
                    'Upload high-quality, well-lit images of your work',
                    'Write a detailed bio about your background and craft',
                    'Select the most relevant specialty categories',
                    'Address the feedback above in your new application',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600">
                      <svg className="w-4 h-4 text-[#9c4327] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Reapply CTA */}
              <button
                onClick={handleReapply}
                disabled={clearing}
                className="w-full rounded-xl bg-[#9c4327] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#7a3520] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                {clearing ? 'Loading...' : 'Submit New Application'}
              </button>
            </div>

            {/* Right — What you submitted */}
            <div className="lg:col-span-3">
              <SubmittedDetails application={application} categories={categories} getCategoryName={getCategoryName} openSections={openSections} toggleSection={toggleSection} submittedDate={submittedDate} />
            </div>
          </div>
        )}

        {/* ── PENDING ── */}
        {application.status === 'pending' && (
          <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8">
            {/* Timeline */}
            <div className="flex items-center gap-0 mb-8">
              {[
                { label: 'Submitted', done: true },
                { label: 'Under Review', done: false, active: true },
                { label: 'Decision', done: false },
              ].map((step, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      step.done ? 'bg-[#9c4327] text-white' :
                      step.active ? 'bg-amber-400 text-white ring-4 ring-amber-100' :
                      'bg-stone-200 text-stone-500'
                    }`}>
                      {step.done ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${step.active ? 'text-amber-700' : step.done ? 'text-stone-700' : 'text-stone-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-6 ${step.done ? 'bg-[#9c4327]' : 'bg-stone-200'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-amber-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Application under review</p>
                  <p className="text-sm text-amber-700 mt-1">Our team typically reviews applications within 2-3 business days. You'll receive an email once a decision is made.</p>
                  {submittedDate && <p className="text-xs text-amber-600 mt-2">Submitted {submittedDate}</p>}
                </div>
              </div>
            </div>

            <SubmittedDetails application={application} categories={categories} getCategoryName={getCategoryName} openSections={openSections} toggleSection={toggleSection} submittedDate={submittedDate} />
          </div>
        )}

        {/* ── APPROVED ── */}
        {application.status === 'approved' && (
          <div className="rounded-xl border border-emerald-200 bg-white overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 px-6 sm:px-8 py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-emerald-900">Welcome to Artisa!</h2>
              <p className="text-sm text-emerald-700 mt-2 max-w-md mx-auto">
                Your artist application has been approved. You can now list your artworks and start selling.
              </p>
              {reviewedDate && <p className="text-xs text-emerald-600 mt-3">Approved {reviewedDate}</p>}
            </div>
            <div className="p-6 sm:px-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'My Profile', desc: 'Complete your artist profile', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z', to: `/artists/${application.user?.username || ''}` },
                { label: 'Add Artwork', desc: 'List your first artwork', icon: 'M12 4.5v15m7.5-7.5h-15', to: '/create-artwork' },
                { label: 'My Artworks', desc: 'Manage your listings', icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z', to: '/my-artworks' },
              ].map(({ label, desc, icon, to }) => (
                <Link key={label} to={to} className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-stone-100 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-5 h-5 text-stone-500 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{label}</p>
                    <p className="text-xs text-stone-500">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


function SubmittedDetails({ application, getCategoryName, openSections, toggleSection, submittedDate }) {
  const Section = ({ title, sectionKey, children, defaultOpen }) => {
    const isOpen = openSections[sectionKey] ?? defaultOpen;
    return (
      <div className="border border-stone-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">{title}</span>
          <svg className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && <div className="p-4">{children}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-stone-900">Your Submission</h3>
        {submittedDate && <span className="text-xs text-stone-400">Submitted {submittedDate}</span>}
      </div>

      <Section title="Why Artisa" sectionKey="reason" defaultOpen={true}>
        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{application.reason}</p>
      </Section>

      {application.bio && (
        <Section title="Bio" sectionKey="bio">
          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{application.bio}</p>
        </Section>
      )}

      {application.specialties?.length > 0 && (
        <Section title="Specialties" sectionKey="specialties">
          <div className="flex flex-wrap gap-1.5">
            {application.specialties.map(id => (
              <span key={id} className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                {getCategoryName(id)}
              </span>
            ))}
          </div>
        </Section>
      )}

      {application.portfolio_samples?.length > 0 && (
        <Section title={`Portfolio · ${application.portfolio_samples.length} images`} sectionKey="portfolio" defaultOpen={true}>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {application.portfolio_samples.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                <img src={url} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-stone-900 text-white rounded-full">Cover</span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {application.social_links && Object.values(application.social_links).some(v => v) && (
        <Section title="Social Links" sectionKey="social">
          <div className="flex flex-wrap gap-2">
            {Object.entries(application.social_links).filter(([, v]) => v).map(([key, url]) => (
              <span key={key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200 capitalize">
                <svg className="w-3 h-3 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                {key}
              </span>
            ))}
          </div>
        </Section>
      )}

      {application.reviewed_at && (
        <div className="text-xs text-stone-400 pt-1">
          Reviewed {new Date(application.reviewed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      )}
    </div>
  );
}

export default ArtistApplication;
