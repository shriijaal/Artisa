import { Link } from 'react-router-dom';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-stone-900 text-stone-400 mt-16">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-6">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block">
              <span className="text-xl font-bold text-white tracking-tight">Artisa</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-stone-500 max-w-xs">
              Premium original art from verified Nepali artists. Collect physical and digital artworks directly from the creators.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 hover:bg-stone-700 hover:text-white transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 hover:bg-stone-700 hover:text-white transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 hover:bg-stone-700 hover:text-white transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Marketplace</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/marketplace" className="text-sm hover:text-[#9c4327] transition-colors">View All</Link>
              </li>
              <li>
                <Link to="/marketplace?category=1" className="text-sm hover:text-[#9c4327] transition-colors">Paintings</Link>
              </li>
              <li>
                <Link to="/marketplace?category=2" className="text-sm hover:text-[#9c4327] transition-colors">Sculptures</Link>
              </li>
              <li>
                <Link to="/marketplace?category=3" className="text-sm hover:text-[#9c4327] transition-colors">Digital Art</Link>
              </li>
              <li>
                <Link to="/marketplace?category=4" className="text-sm hover:text-[#9c4327] transition-colors">Photography</Link>
              </li>
            </ul>
          </div>

          {/* For Artists */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">For Artists</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/register" className="text-sm hover:text-[#9c4327] transition-colors">Join as Artist</Link>
              </li>
              <li>
                <Link to="/commissions/new" className="text-sm hover:text-[#9c4327] transition-colors">Accept Commissions</Link>
              </li>
              <li>
                <Link to="/settings/earnings" className="text-sm hover:text-[#9c4327] transition-colors">Earnings</Link>
              </li>
              <li>
                <Link to="/my-artworks" className="text-sm hover:text-[#9c4327] transition-colors">My Artworks</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Stay in the loop</h4>
            <p className="text-sm text-stone-500 leading-relaxed mb-4">
              Get weekly picks and new artist spotlights.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 min-w-0 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#9c4327] transition-colors"
              />
              <button
                type="submit"
                className="bg-[#9c4327] hover:bg-[#7a3520] text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-stone-600">
            <span>&copy; {new Date().getFullYear()} Artisa</span>
            <span>&middot;</span>
            <span>Made in Nepal</span>
            <span>&middot;</span>
            <span>Secure payments via Khalti</span>
          </div>
          <button
            onClick={scrollToTop}
            className="h-8 w-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 hover:bg-stone-700 hover:text-white transition-colors"
            aria-label="Back to top"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
