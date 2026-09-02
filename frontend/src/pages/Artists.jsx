import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';

const Artists = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchArtists();
  }, [page]);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/artists/list/?page=${page}`);
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
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 pt-10 pb-24">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-stone-900 mb-2">Our Artists</h1>
            <p className="text-stone-500">Discover {total} verified artists creating unique artworks across Nepal.</p>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : artists.length === 0 ? (
            <div className="text-center py-20 text-stone-400">No artists found.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {artists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => navigate(`/artists/${artist.username}`)}
                    className="group bg-white rounded-lg border border-stone-200 overflow-hidden hover:border-stone-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="h-32 bg-stone-100 relative overflow-hidden">
                      {artist.cover_image ? (
                        <img src={artist.cover_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200" />
                      )}
                      <div className="absolute -bottom-8 left-5">
                        <div className="w-16 h-16 rounded-full border-4 border-white bg-stone-200 overflow-hidden">
                          {artist.avatar ? (
                            <img src={artist.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-stone-400">
                              {artist.username?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="pt-10 px-5 pb-5">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-stone-900">
                          {artist.first_name || artist.last_name
                            ? `${artist.first_name || ''} ${artist.last_name || ''}`.trim()
                            : artist.username}
                        </h3>
                        {artist.verified_badge && (
                          <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        )}
                      </div>
                      <p className="text-sm text-stone-500 mb-2">@{artist.username}</p>
                      {artist.bio && (
                        <p className="text-sm text-stone-600 line-clamp-2 mb-3">{artist.bio}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-stone-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {artist.artwork_count} artwork{artist.artwork_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-stone-500">
                    Page {page} of {pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="px-3 py-1.5 text-sm rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next
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

export default Artists;
