import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMenuOpen }) {
  const { theme, toggleTheme } = useTheme();
  const { cartCount, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const handleSearchToggle = () => {
    if (searchOpen && searchQuery.trim() === '') {
      setSearchOpen(false);
    } else {
      setSearchOpen(v => !v);
    }
  };

  const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );

  const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );

  return (
    <header id="siteHeader" className={scrolled ? 'scrolled' : ''}>
      <div className="main-nav-container">

        {/* LEFT: hamburger */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
          <button id="menuToggleBtn" onClick={() => onMenuOpen && onMenuOpen(true)} className="nav-icon-btn" title="Browse categories">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        {/* CENTER: logo */}
        <Link to="/" className="logo">Rue and Kay Atelier.</Link>

        {/* RIGHT: icons */}
        <div id="navRightGroup" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>

          {/* Search */}
          <div className="search-widget-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {searchOpen && (
              <input
                ref={searchRef}
                type="text"
                id="storefrontSearchInput"
                placeholder="Search…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', borderBottom: '1px solid var(--accent)', outline: 'none', padding: '4px 8px', fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem', background: 'transparent', color: 'var(--text-main)', width: '160px' }}
              />
            )}
            <button id="searchToggleBtn" onClick={handleSearchToggle} className="nav-icon-btn" title="Search">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </div>

          {/* Theme toggle */}
          <button id="themeToggleBtn" onClick={toggleTheme} className="nav-icon-btn" title="Toggle dark mode">
            {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
          </button>

          {/* Account */}
          <Link
            id="headerAccountLink"
            to="/auth"
            className="nav-icon-btn"
            title="My Account"
            style={{ textDecoration: 'none', color: user ? '#C2185B' : 'inherit' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {user ? (
                <>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="#FCE4EC"/>
                  <circle cx="12" cy="7" r="4" fill="#C2185B" stroke="#C2185B"/>
                </>
              ) : (
                <>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </>
              )}
            </svg>
          </Link>

          {/* Cart */}
          <div
            id="headerCartTrigger"
            onClick={() => navigate('/cart')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", userSelect: 'none', padding: '6px' }}
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                style={{ color: 'var(--accent)' }}>
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span id="cartCount" style={{ position: 'absolute', top: '-7px', right: '-7px', background: 'var(--accent)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                {cartCount}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--accent)', letterSpacing: '0.5px' }}>Bag</span>
              <span id="cartHeaderPrice" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                KES {cartTotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
