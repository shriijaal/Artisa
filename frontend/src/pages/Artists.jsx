import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/formatPrice';

const Artists = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState('');
  const [commissionOnly, setCommissionOnly] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    fetch('/api/artworks/categories/')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(data.filter(c => !c.parent)))
      .catch(() => {});
  }, []);

  const fetchArtists = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, sort });
      if (search) params.set('q', search);
      if (commissionOnly) params.set('commission_available', 'true');
      if (selectedSpecialty) params.set('specialty', selectedSpecialty);

      const res = await fetch(`/api/auth/artists/list/?${params}`);
      if (res.ok) {
        const data = await res.json();
        setArtists(data.results);
        setPages(data.pages);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Error fetching artists:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, commissionOnly, selectedSpecialty, sort]);

  useEffect(() => { fetchArtists(); }, [fetchArtists]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setCommissionOnly(false);
    setSelectedSpecialty('');
    setSort('newest');
    setPage(1);
  };

  const hasFilters = search || commissionOnly || selectedSpecialty || sort !== 'newest';

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <Header />
      <main className="flex-1">
        {/* ── HERO ── */}
        <section className="relative z-0 bg-stone-900 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#fc8d6b] mb-3">Commissions</p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Find an Artist for Your Commission
              </h1>
              <p className="text-base text-stone-400 leading-relaxed max-w-lg">
                Browse verified Nepali artists ready to bring your vision to life. Filter by specialty, availability, and style.
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-8 flex gap-3 max-w-xl">
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or style..."
                  className="w-full rounded-lg bg-white/10 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#fc8d6b]/50 focus:border-[#fc8d6b]/50"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-white text-stone-900 text-sm font-semibold hover:bg-stone-100 transition-colors"
              >
                Search
              </button>
            </form>

            <div className="mt-4 flex items-center gap-4 text-sm text-stone-500">
              <span>{total} artist{total !== 1 ? 's' : ''} found</span>
              {commissionOnly && <span className="text-[#fc8d6b]">· Commission-ready only</span>}
            </div>
          </div>
        </section>

        {/* ── FILTERS ── */}
        <section className="border-b border-stone-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Commission toggle */}
              <button
                onClick={() => { setCommissionOnly(!commissionOnly); setPage(1); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  commissionOnly
                    ? 'bg-[#9c4327] text-white border-[#9c4327]'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                }`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                Commissions Open
              </button>

              {/* Specialty chips */}
              <div className="h-5 w-px bg-stone-200 hidden sm:block" />
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 8).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedSpecialty(selectedSpecialty === cat.id ? '' : cat.id); setPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedSpecialty === cat.id
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="ml-auto">
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-stone-300"
                >
                  <option value="newest">Newest</option>
                  <option value="artworks">Most Artworks</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>

            {hasFilters && (
              <button onClick={resetFilters} className="mt-3 text-xs text-[#9c4327] hover:text-[#7a3520] font-medium transition-colors">
                Clear all filters
              </button>
            )}
          </div>
        </section>

        {/* ── ARTIST GRID ── */}
        <section className="max-w-7xl mx-auto px-6 py-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                  <div className="skeleton h-40 w-full rounded-none" />
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="skeleton h-5 w-32" />
                      <div className="skeleton h-4 w-4 rounded-full" />
                    </div>
                    <div className="skeleton h-3 w-20" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-2/3" />
                    <div className="flex gap-2 mt-4">
                      <div className="skeleton h-6 w-16 rounded-full" />
                      <div className="skeleton h-6 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : artists.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <p className="text-stone-500 font-medium">No artists found</p>
              <p className="text-sm text-stone-400 mt-1">Try adjusting your filters or search terms.</p>
              {hasFilters && (
                <button onClick={resetFilters} className="mt-4 text-sm text-[#9c4327] hover:text-[#7a3520] font-medium">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} user={user} navigate={navigate} categories={categories} />
                ))}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ← Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(pages)].map((_, i) => {
                      const p = i + 1;
                      if (pages > 7 && p > 2 && p < pages - 1 && Math.abs(p - page) > 1) {
                        return p === 3 || p === pages - 2 ? <span key={p} className="text-stone-400 px-1">...</span> : null;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            p === page ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="px-4 py-2 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};


function ArtistCard({ artist, user, navigate, categories }) {
  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : null;
  };

  const commissionPrice = artist.commission_starting_price
    ? `Starting at रू ${formatPrice(artist.commission_starting_price)}`
    : null;

  return (
    <div className="group">
      {/* Avatar — sits above the image card */}
      <div className="flex justify-start pl-5 mb-[-28px] relative z-10">
        <button onClick={() => navigate(`/artists/${artist.username}`)}>
          <div className="w-14 h-14 rounded-full border-[3px] border-white bg-stone-200 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
            {artist.avatar ? (
              <img src={artist.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-stone-400">
                {artist.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Image Card */}
      <button
        onClick={() => navigate(`/artists/${artist.username}`)}
        className="relative block w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-100 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all duration-300"
      >
        <div className="h-44">
          {artist.sample_artworks?.length > 0 ? (
            <div className="flex h-full">
              {artist.sample_artworks.slice(0, 2).map((art, i) => (
                <div key={art.id} className={`relative overflow-hidden ${i === 0 ? 'flex-1' : 'flex-1 border-l border-white/20'}`}>
                  {art.image ? (
                    <img src={art.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-stone-200" />
                  )}
                </div>
              ))}
            </div>
          ) : artist.cover_image ? (
            <img src={artist.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200" />
          )}
        </div>

        {/* Commission badge */}
        {artist.commission_available && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#9c4327] text-white text-[10px] font-bold uppercase tracking-wide shadow-lg">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Commissions Open
          </div>
        )}
      </button>

      {/* Details — transparent, no background */}
      <div className="pt-2 px-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <button onClick={() => navigate(`/artists/${artist.username}`)} className="text-left">
            <h3 className="font-bold text-stone-900 group-hover:text-[#9c4327] transition-colors">
              {artist.first_name || artist.last_name
                ? `${artist.first_name || ''} ${artist.last_name || ''}`.trim()
                : artist.username}
            </h3>
          </button>
          {artist.verified_badge && (
            <svg className="h-4 w-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <p className="text-xs text-stone-400 mb-2">@{artist.username}</p>

        {artist.bio && (
          <p className="text-sm text-stone-600 line-clamp-2 mb-3 leading-relaxed">{artist.bio}</p>
        )}

        {/* Specialties */}
        {artist.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {artist.specialties.slice(0, 3).map((id) => {
              const name = getCategoryName(id);
              return name ? (
                <span key={id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                  {name}
                </span>
              ) : null;
            })}
            {artist.specialties.length > 3 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-400">
                +{artist.specialties.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-stone-500 mb-3">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {artist.artwork_count} artwork{artist.artwork_count !== 1 ? 's' : ''}
          </span>
          {artist.avg_rating && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {artist.avg_rating}
            </span>
          )}
        </div>

        {/* Commission price */}
        {artist.commission_available && commissionPrice && (
          <p className="text-xs font-semibold text-[#9c4327] mb-3">{commissionPrice}</p>
        )}

        {/* Single CTA */}
        <Link
          to={artist.commission_available && user ? `/commissions/new?artist=${artist.id}&username=${artist.username}` : artist.commission_available ? '/login' : `/artists/${artist.username}`}
          className="block w-full rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white text-center hover:bg-stone-800 transition-colors"
        >
          {artist.commission_available ? 'Commission Artist' : 'View Profile'}
        </Link>
      </div>
    </div>
  );
}


export default Artists;
