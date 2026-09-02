import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

const CommissionLanding = () => {
  const { user } = useAuth();

  const steps = [
    { num: '01', title: 'Describe Your Vision', desc: 'Tell the artist what you want — a portrait, illustration, custom piece, or any creative work. Include details like style, size, and deadline.' },
    { num: '02', title: 'Artist Matches', desc: 'Browse verified artists who specialize in your request. View their portfolios, ratings, and availability before choosing.' },
    { num: '03', title: 'Agree & Pay', desc: 'Once you and the artist agree on scope and price, payment is held in escrow. The artist begins work only after you confirm.' },
    { num: '04', title: 'Receive Your Art', desc: 'Review drafts, provide feedback, and approve the final piece. Your artwork is delivered — physical or digital — to your specifications.' },
  ];

  const reasons = [
    { icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
    ), title: 'Secure Payments', desc: 'Funds held in escrow until you approve the final work. No risk of losing your money.' },
    { icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
    ), title: 'Verified Artists', desc: 'Every artist is vetted and approved. Work with professionals who have proven track records.' },
    { icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
    ), title: 'Direct Communication', desc: 'Chat directly with artists. Share references, give feedback, and collaborate until it\'s perfect.' },
    { icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg>
    ), title: ' revisions Included', desc: 'Negotiate revision rounds upfront. Get exactly what you envisioned.' },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9c4327] mb-4">Commissions</p>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-5 leading-tight max-w-2xl mx-auto">
            Bring Your Vision to Life with a Custom Artwork
          </h1>
          <p className="text-lg text-stone-500 mb-8 max-w-xl mx-auto">
            Work directly with verified Nepali artists to create one-of-a-kind pieces — portraits, illustrations, physical art, and more.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to={user ? '/commissions/new' : '/register'}
              className="rounded-lg bg-[#9c4327] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7a3520] transition-colors"
            >
              {user ? 'Request a Commission' : 'Get Started'}
            </Link>
            <Link
              to="/marketplace"
              className="rounded-lg border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Browse Artworks
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white border-y border-stone-200 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-stone-900 text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step) => (
                <div key={step.num} className="text-center">
                  <div className="text-4xl font-bold text-stone-200 mb-3">{step.num}</div>
                  <h3 className="font-semibold text-stone-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Commission */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-stone-900 text-center mb-12">Why Commission on Artisa?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {reasons.map((r) => (
              <div key={r.title} className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 mb-4">
                  {r.icon}
                </div>
                <h3 className="font-semibold text-stone-900 mb-1">{r.title}</h3>
                <p className="text-sm text-stone-500">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-stone-900 py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Create Something Unique?</h2>
            <p className="text-stone-400 mb-8">
              Join thousands of art lovers who have commissioned custom pieces from talented Nepali artists.
            </p>
            <Link
              to={user ? '/commissions/new' : '/register'}
              className="inline-block rounded-lg bg-[#9c4327] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#7a3520] transition-colors"
            >
              {user ? 'Start Your Commission' : 'Create an Account'}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CommissionLanding;
