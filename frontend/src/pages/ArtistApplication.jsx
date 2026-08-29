import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const ArtistApplication = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    portfolio_samples: null,
    verification_document: null,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/auth/artist/application/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setApplication(data);
      } else if (response.status === 404) {
        setApplication(null);
      }
    } catch (err) {
      console.error('Error fetching application:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const formDataToSend = new FormData();
      formDataToSend.append('reason', formData.reason);
      
      if (formData.portfolio_samples) {
        for (let i = 0; i < formData.portfolio_samples.length; i++) {
          formDataToSend.append('portfolio_samples', formData.portfolio_samples[i]);
        }
      }
      
      if (formData.verification_document) {
        formDataToSend.append('verification_document', formData.verification_document);
      }

      const response = await fetch('/api/auth/artist/application/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        setApplication(data);
        setError('');
        addToast('Application submitted successfully!', 'success');
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to submit application');
        addToast(err.error || 'Failed to submit application', 'error');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      addToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading application..." />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      <main className="mx-auto max-w-3xl px-6 py-10 page-enter">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <button onClick={() => navigate('/profile/edit')} className="hover:text-amber-600 transition-colors">Profile Settings</button>
            <span>/</span>
            <span className="font-medium text-stone-800">Artist Application</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>Artist Application</h1>
        </div>

        {application ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Application Status</h2>
            
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wide text-stone-500 mb-2">
                  Status
                </h3>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                  application.status === 'approved' 
                    ? 'bg-green-100 text-green-800'
                    : application.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium uppercase tracking-wide text-stone-500 mb-2">
                  Reason
                </h3>
                <p className="text-stone-700">{application.reason}</p>
              </div>

              {application.rejection_reason && (
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wide text-stone-500 mb-2">
                    Rejection Reason
                  </h3>
                  <p className="text-red-700">{application.rejection_reason}</p>
                </div>
              )}

              {application.reviewed_at && (
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wide text-stone-500 mb-2">
                    Reviewed At
                  </h3>
                  <p className="text-stone-700">
                    {new Date(application.reviewed_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Submit Portfolio</h2>
            <p className="mt-2 text-stone-600">
              Share your portfolio and tell us why you'd like to join Artisa as a verified artist.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-stone-700 mb-2">
                  Why do you want to become an artist on Artisa?
                </label>
                <textarea
                  id="reason"
                  rows={6}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                  placeholder="Tell us about your artistic journey, your style, and what you hope to achieve on Artisa..."
                  required
                />
              </div>

              <div>
                <label htmlFor="portfolio_samples" className="block text-sm font-medium text-stone-700 mb-2">
                  Portfolio Samples (Required)
                </label>
                <p className="text-sm text-stone-500 mb-3">
                  Upload 3-5 images of your best artwork. Max 5MB per image.
                </p>
                <input
                  id="portfolio_samples"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, portfolio_samples: e.target.files })}
                  className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-stone-100 file:text-stone-600 hover:file:bg-stone-200"
                  required
                />
                {formData.portfolio_samples && (
                  <p className="mt-2 text-sm text-stone-600">
                    {formData.portfolio_samples.length} file(s) selected
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="verification_document" className="block text-sm font-medium text-stone-700 mb-2">
                  Verification Document (Optional)
                </label>
                <p className="text-sm text-stone-500 mb-3">
                  Upload ID or portfolio proof for verification. Admin-only access. Max 5MB.
                </p>
                <input
                  id="verification_document"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFormData({ ...formData, verification_document: e.target.files[0] })}
                  className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-stone-100 file:text-stone-600 hover:file:bg-stone-200"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Application →'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArtistApplication;
