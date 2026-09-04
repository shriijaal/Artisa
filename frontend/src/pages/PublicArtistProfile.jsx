import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ArtistSideNav from '../components/ArtistSideNav';
import RecommendedCarousel from '../components/RecommendedCarousel';
import { trackInteraction } from '../services/api';

const ArtworkSkeleton = () => (
  <div className="rounded-lg overflow-hidden bg-stone-100 animate-pulse aspect-[3/4]" />
);

const ProfileSkeleton = () => (
  <div className="min-h-screen bg-stone-50">
    <Header />
    <div className="relative h-64 sm:h-80 lg:h-96 w-full bg-stone-200 animate-pulse" />
    <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 -mt-16 sm:-mt-20">
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
        <div className="relative z-20 h-32 w-32 sm:h-36 sm:w-36 rounded-full border-4 border-white bg-stone-200 animate-pulse shadow-2xl" />
        <div className="flex-1 text-center sm:text-left sm:mb-2 space-y-3">
          <div className="h-8 w-56 rounded bg-stone-200 animate-pulse mx-auto sm:mx-0" />
          <div className="h-4 w-28 rounded bg-stone-200 animate-pulse mx-auto sm:mx-0" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5 animate-pulse h-24" />
        <div className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5 animate-pulse h-24" />
        <div className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5 animate-pulse h-24" />
      </div>
      <div className="mt-6 h-32 rounded-lg bg-stone-200 animate-pulse" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ArtworkSkeleton key={i} />
        ))}
      </div>
    </div>
    <Footer />
  </div>
);

const PublicArtistProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artworksLoading, setArtworksLoading] = useState(true);
  const [error, setError] = useState('');
  const [artistRating, setArtistRating] = useState({ avg_rating: null, review_count: 0 });

  useEffect(() => {
    fetchProfile();
    fetchArtistArtworks();
  }, [username]);

  useEffect(() => {
    if (profile?.user?.id) fetchArtistRating();
  }, [profile?.user?.id]);

  useEffect(() => {
    if (profile && profile.user) {
      trackInteraction('artist', profile.user.id, 'profile_view');
    }
  }, [profile?.user?.id]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/auth/artists/${username}/`);
      if (response.ok) {
        setProfile(await response.json());
      } else if (response.status === 404) {
        setError('Artist profile not found');
      } else {
        setError('Failed to load profile');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchArtistRating = async () => {
    try {
      const res = await fetch(`/api/reviews/artist/${profile.user.id}/avg/`);
      if (res.ok) setArtistRating(await res.json());
    } catch {}
  };

  const fetchArtistArtworks = async () => {
    try {
      const response = await fetch(`/api/artworks/published/?artist=${username}`);
      if (response.ok) {
        setArtworks(await response.json());
      }
    } catch {
      // silently fail
    } finally {
      setArtworksLoading(false);
    }
  };

  const handleCommissionClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/commissions/new?artist=${profile.user.id}&username=${username}`);
  };

  const formatMemberSince = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 gap-6 px-4">
          <div className="h-20 w-20 rounded-full bg-stone-100 flex items-center justify-center">
            <svg className="h-10 w-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-stone-900 mb-1 font-heading">
              {error === 'Artist profile not found' ? 'Artist Not Found' : 'Something Went Wrong'}
            </h2>
            <p className="text-stone-500 text-sm max-w-xs mx-auto">
              {error === 'Artist profile not found'
                ? "The artist you're looking for doesn't exist or may have been removed."
                : 'We encountered an issue loading this profile. Please try again.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="rounded-lg bg-[#000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) return null;

  const socialLinks = profile.social_links || {};
  const isOwnProfile = user?.id === profile.user?.id;

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <Header />

      {isOwnProfile && <ArtistSideNav artworkCount={artworks.length} />}

      <div className={`flex-1 flex flex-col ${isOwnProfile ? 'md:pl-60 xl:pl-72 pb-16 md:pb-0' : ''}`}>
        {/* Cover Image */}
        <div className="relative h-64 sm:h-80 lg:h-96 w-full bg-gradient-to-br from-stone-800 via-[#9c4327]/40 to-stone-700 z-0">
          {profile.cover_image ? (
            <img
              src={profile.cover_image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-[#9c4327]/40 to-stone-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Profile Header */}
        <div className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 sm:px-8 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative z-20 flex-shrink-0">
              <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                {profile.user.avatar ? (
                  <img
                    src={profile.user.avatar}
                    alt={profile.user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600">
                    <span className="text-4xl font-bold text-white font-heading">
                      {profile.user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Verified Badge — emerald per design system */}
              {profile.verified_badge && (
                <div className="absolute -bottom-0.5 -right-0.5 z-30 group/badge">
                  <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500 border-[3px] border-white shadow-lg cursor-pointer hover:bg-emerald-600 transition-colors">
                    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" />
                    </svg>
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 pointer-events-none opacity-0 group-hover/badge:opacity-100 transition-opacity duration-200 z-40">
                    <div className="rounded-lg bg-stone-900 px-4 py-3 shadow-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="h-4 w-4 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" clipRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" />
                        </svg>
                        <span className="text-sm font-semibold text-white">Verified Artist</span>
                      </div>
                      <p className="text-xs text-stone-400 leading-relaxed">This artist has been reviewed and approved by Artisa. Their identity and portfolio have been verified.</p>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-stone-900 rotate-45" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Name + Actions */}
            <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-end justify-between min-w-0 text-center sm:text-left">
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 truncate leading-tight font-heading">
                  {profile.user.first_name || profile.user.username}
                  {profile.user.last_name ? ` ${profile.user.last_name}` : ''}
                </h1>
                <p className="text-sm text-stone-500 mt-0.5">@{profile.user.username}</p>
                {artistRating.review_count > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-4 w-4 ${star <= Math.round(artistRating.avg_rating) ? 'text-amber-500' : 'text-stone-200'}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-stone-900">{artistRating.avg_rating}</span>
                    <span className="text-xs text-stone-500">({artistRating.review_count} review{artistRating.review_count !== 1 ? 's' : ''})</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 mt-4 sm:mt-0">
                {Object.keys(socialLinks).length > 0 && (
                  <div className="hidden sm:flex items-center gap-2">
                    {socialLinks.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-pink-50 hover:border-pink-200 transition-all duration-200 group"
                      >
                        <svg className="h-4 w-4 text-stone-500 group-hover:text-pink-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group"
                      >
                        <svg className="h-4 w-4 text-stone-500 group-hover:text-blue-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>
                    )}
                    {socialLinks.website && (
                      <a
                        href={socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50 hover:border-stone-300 transition-all duration-200 group"
                      >
                        <svg className="h-4 w-4 text-stone-500 group-hover:text-stone-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}

                {isOwnProfile ? (
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="rounded-lg bg-[#000] px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 active:bg-stone-900 transition whitespace-nowrap flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={handleCommissionClick}
                    className="rounded-lg bg-[#000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 active:bg-stone-900 transition whitespace-nowrap flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Commission Artist
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats — compact inline row */}
          <div className="mt-6 flex items-center justify-center gap-3 text-sm flex-wrap">
            <span className="font-heading font-bold text-stone-900">{artworks.length} artworks</span>
            <span className="text-stone-300">·</span>
            <span className="text-stone-500">Member since {formatMemberSince(profile.created_at || profile.user?.date_joined || new Date())}</span>
            <span className="text-stone-300">·</span>
            <span className={`font-medium ${profile.verified_badge ? 'text-emerald-600' : 'text-stone-400'}`}>
              {profile.verified_badge ? '✓ Verified' : 'Unverified'}
            </span>
          </div>

          {/* About Section — merged bio + social links */}
          {(profile.bio || Object.keys(socialLinks).length > 0) && (
            <div className="mt-6 rounded-lg border border-stone-200 bg-white p-6">
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-[0.05em] mb-4">About</h2>
              {profile.bio && (
                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap text-[15px]">{profile.bio}</p>
              )}
              {Object.keys(socialLinks).length > 0 && (
                <div className={`flex flex-wrap gap-2.5 ${profile.bio ? 'mt-4 pt-4 border-t border-stone-100' : ''}`}>
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-stone-50 border border-stone-200 px-3.5 py-2 text-sm font-medium text-stone-600 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-all duration-200"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                      Instagram
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a
                      href={socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-stone-50 border border-stone-200 px-3.5 py-2 text-sm font-medium text-stone-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </a>
                  )}
                  {socialLinks.website && (
                    <a
                      href={socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-stone-50 border border-stone-200 px-3.5 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 hover:border-stone-300 transition-all duration-200"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Website
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Artworks Section */}
          <div className="mt-10 mb-12">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-stone-900 font-heading">
                  Artworks
                </h2>
                {artworks.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
                    {artworks.length} work{artworks.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {artworksLoading ? (
              <div className="columns-2 sm:columns-3 gap-3 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="break-inside-avoid rounded-lg overflow-hidden bg-stone-100 animate-pulse">
                    <div className={`${i % 3 === 0 ? 'aspect-[3/4]' : i % 3 === 1 ? 'aspect-square' : 'aspect-[4/3]'} w-full bg-stone-200`} />
                  </div>
                ))}
              </div>
            ) : artworks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-300 bg-white p-16 text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center">
                  <svg className="h-8 w-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-stone-700 mb-1 font-heading">
                  {isOwnProfile ? 'Your Gallery is Empty' : 'No Artworks Yet'}
                </h3>
                <p className="text-stone-500 text-sm max-w-xs mx-auto mb-4">
                  {isOwnProfile
                    ? 'Start building your gallery by uploading your first original physical or digital artwork.'
                    : "This artist hasn't published any artworks yet. Check back soon for new creations."}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/artworks/create')}
                    className="rounded-lg bg-[#000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition"
                  >
                    + Create First Artwork
                  </button>
                )}
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 gap-3 space-y-3">
                {artworks.map((artwork, idx) => {
                  const primaryImage = artwork.images?.find((img) => img.is_primary) || artwork.images?.[0];
                  const aspects = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/3]', 'aspect-[5/6]', 'aspect-[3/2]'];
                  const aspectClass = aspects[idx % aspects.length];
                  const categoryName = artwork.category?.name;
                  const artworkType = artwork.type;
                  return (
                    <div
                      key={artwork.id}
                      onClick={() => navigate(`/artworks/${artwork.id}`)}
                      className="group cursor-pointer break-inside-avoid rounded-lg overflow-hidden relative bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/artworks/${artwork.id}`); } }}
                    >
                      {primaryImage ? (
                        <img
                          src={primaryImage.image}
                          alt={artwork.title}
                          className={`w-full ${aspectClass} object-cover group-hover:scale-105 transition-transform duration-500`}
                          loading="lazy"
                        />
                      ) : (
                        <div className={`w-full ${aspectClass} flex items-center justify-center text-stone-300 bg-stone-100`}>
                          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Type pill */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-white/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-stone-800 shadow-sm border border-white/40">
                          <span className={`h-1.5 w-1.5 rounded-full ${artworkType === 'physical' ? 'bg-[#9c4327]' : 'bg-stone-500'}`} />
                          {artworkType === 'physical' ? 'Physical' : 'Digital'}
                        </span>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                        {categoryName && (
                          <span className="inline-flex self-start items-center rounded-lg bg-white/15 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-white shadow-sm border border-white/10 mb-2">
                            {categoryName}
                          </span>
                        )}
                        <p className="text-white text-sm font-semibold line-clamp-1 font-heading">{artwork.title}</p>
                        <p className="text-[#fc8d6b] text-xs font-bold mt-0.5">
                          NPR {artwork.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommended for You */}
          <div className="mb-12">
            <RecommendedCarousel
              title="Recommended for You"
              subtitle="Based on your interests"
              endpoint="/api/recs/artworks/?k=8"
            />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default PublicArtistProfile;
