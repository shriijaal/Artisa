import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-stone-900 text-stone-400 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block">
              <span className="text-xl font-bold text-white tracking-tight font-serif">
                Artisa
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-stone-500 max-w-xs">
              Premium original art from verified Nepali artists. Collect physical and digital artworks directly from the creators.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/marketplace" className="text-sm hover:text-[#9c4327] transition-colors">Marketplace</Link>
              </li>
              <li>
                <Link to="/register" className="text-sm hover:text-[#9c4327] transition-colors">Join as Artist</Link>
              </li>
              <li>
                <Link to="/login" className="text-sm hover:text-[#9c4327] transition-colors">Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Info</h4>
            <ul className="space-y-2.5">
              <li className="text-sm">Nepal-based marketplace</li>
              <li className="text-sm">Secure payments via Khalti</li>
              <li className="text-sm">Physical &amp; digital artworks</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone-600">&copy; {new Date().getFullYear()} Artisa. All rights reserved.</p>
          <p className="text-xs text-stone-600">Made in Nepal</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
