import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { theme, toggleTheme } = useTheme();

  const [tab, setTab] = useState('login');
  const [showSplash, setShowSplash] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState({ msg: '', type: '' });
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupStatus, setSignupStatus] = useState({ msg: '', type: '' });
  const [signupLoading, setSignupLoading] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (returnTo) { navigate(returnTo); return; }
        setLoggedIn(true);
        setUserEmail(session.user.email);
      }
    });
  }, [navigate, returnTo]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginStatus({ msg: '', type: '' });
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) {
      setLoginStatus({ msg: error.message, type: 'error' });
    } else {
      setLoginStatus({ msg: 'Success! Redirecting...', type: 'success' });
      setTimeout(() => navigate(returnTo || '/'), 900);
    }
    setLoginLoading(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setSignupLoading(true);
    setSignupStatus({ msg: '', type: '' });
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: { data: { full_name: signupName } }
    });
    if (error) {
      setSignupStatus({ msg: error.message, type: 'error' });
    } else {
      setShowSplash(true);
    }
    setSignupLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setTab('login');
  }

  const statusColors = {
    error: { bg: '#fff0f3', color: '#c0152c', border: '1px solid #f5c6ce' },
    success: { bg: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
    info: { bg: 'var(--accent-light)', color: 'var(--accent-hover)', border: '1px solid #f9a8c9' },
  };

  const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
  const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'var(--header-bg)', transition: 'background 0.3s ease', borderBottom: '1px solid var(--border)', padding: '0 40px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Link to="/" className="logo" style={{ fontFamily: "'Stalemate', cursive", fontSize: '2rem', color: 'var(--text-main)', textDecoration: 'none' }}>Rue and Kay Atelier.</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button id="themeToggleBtn" onClick={toggleTheme} title="Toggle Dark Mode" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#C2185B', display: 'flex', alignItems: 'center', padding: '4px' }}>
            {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
          </button>
          <Link to="/" className="header-back-link" style={{ fontSize: '0.85rem', color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Shop
          </Link>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="auth-card">
          <div className="card-strip"></div>

          {/* Logged-in panel */}
          {loggedIn && !showSplash && (
            <div className="form-panel active" id="loggedInPanel">
              <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--accent-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h2 className="panel-heading" style={{ marginBottom: '8px' }}>You're signed in</h2>
                <p id="loggedInEmail" className="panel-subtext" style={{ marginBottom: '28px' }}>Signed in as {userEmail}</p>
                <Link to="/" className="submit-btn" style={{ display: 'block', textDecoration: 'none', textAlign: 'center', marginBottom: '12px' }}>Back to Shop</Link>
                <button
                  onClick={handleSignOut}
                  style={{ width: '100%', background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--muted)', padding: '13px', borderRadius: '10px', fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                >Sign Out</button>
              </div>
            </div>
          )}

          {/* Signup success splash */}
          {showSplash && (
            <div className="success-splash" style={{ display: 'block' }}>
              <div className="splash-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 style={{ color: 'var(--text)' }}>Check your email!</h2>
              <p>We've sent a confirmation link to your inbox. Click it to activate your account, then come back to sign in.</p>
              <button className="submit-btn" style={{ marginTop: '24px' }} onClick={() => { setShowSplash(false); setTab('login'); }}>Go to Sign In</button>
            </div>
          )}

          {/* Auth tabs */}
          {!loggedIn && !showSplash && (
            <>
              <div className="tab-bar">
                <button className={`tab-btn${tab === 'login' ? ' active' : ''}`} id="tabLoginBtn" onClick={() => setTab('login')}>Sign In</button>
                <button className={`tab-btn${tab === 'signup' ? ' active' : ''}`} id="tabSignupBtn" onClick={() => setTab('signup')}>Create Account</button>
              </div>

              {/* Login panel */}
              {tab === 'login' && (
                <div className="form-panel active" id="loginPanel">
                  <h2 className="panel-heading">Welcome back</h2>
                  <p className="panel-subtext">Sign in to view your saved wishlist and manage your account.</p>
                  <form id="loginForm" onSubmit={handleLogin}>
                    <div className="field-group">
                      <label htmlFor="loginEmail">Email Address</label>
                      <input type="email" id="loginEmail" placeholder="you@example.com" required autoComplete="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="loginPassword">Password</label>
                      <input type="password" id="loginPassword" placeholder="••••••••" required autoComplete="current-password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="submit-btn" id="loginBtn" disabled={loginLoading}>
                      {loginLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>
                  {loginStatus.msg && (
                    <div id="loginStatus" className={`status-msg ${loginStatus.type}`} style={{ display: 'block' }}>{loginStatus.msg}</div>
                  )}
                  <p className="switch-prompt">Don't have an account? <a onClick={() => setTab('signup')} style={{ cursor: 'pointer' }}>Create one here</a></p>
                </div>
              )}

              {/* Signup panel */}
              {tab === 'signup' && (
                <div className="form-panel active" id="signupPanel">
                  <h2 className="panel-heading">Join Rue and Kay</h2>
                  <p className="panel-subtext">Create a free account to save your favourite bags and track your orders.</p>
                  <form id="signupForm" onSubmit={handleSignup}>
                    <div className="field-group">
                      <label htmlFor="signupName">Full Name</label>
                      <input type="text" id="signupName" placeholder="Your full name" required autoComplete="name" value={signupName} onChange={e => setSignupName(e.target.value)} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="signupEmail">Email Address</label>
                      <input type="email" id="signupEmail" placeholder="you@example.com" required autoComplete="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="signupPassword">Password</label>
                      <input type="password" id="signupPassword" placeholder="Min. 6 characters" required minLength={6} autoComplete="new-password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="submit-btn" id="signupBtn" disabled={signupLoading}>
                      {signupLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                  </form>
                  {signupStatus.msg && (
                    <div id="signupStatus" className={`status-msg ${signupStatus.type}`} style={{ display: 'block' }}>{signupStatus.msg}</div>
                  )}
                  <p className="switch-prompt">Already have an account? <a onClick={() => setTab('login')} style={{ cursor: 'pointer' }}>Sign in</a></p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
