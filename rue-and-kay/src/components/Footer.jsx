import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer({ onFilterCategory }) {
  const [showContact, setShowContact] = useState(false);

  return (
    <footer className="site-footer">
      {!showContact ? (
        <div id="footerDefaultLinks">
          <div className="footer-main-columns">
            {/* Brand column */}
            <div className="footer-brand-col footer-column">
              <h2>Rue and Kay Atelier.</h2>
              <p>Your premier luxury atelier in Nairobi, Kenya. Handcrafted handbags, accessories and more — made with love, worn with pride.</p>
              <form className="footer-newsletter" onSubmit={e => e.preventDefault()}>
                <input type="email" placeholder="Your email address" />
                <button type="submit">Subscribe</button>
              </form>
            </div>

            {/* Shop column */}
            <div className="footer-column">
              <h3>Shop</h3>
              <ul>
                <li><a href="#" onClick={e => { e.preventDefault(); onFilterCategory && onFilterCategory('all'); }}>All Products</a></li>
                <li><a href="#" onClick={e => { e.preventDefault(); onFilterCategory && onFilterCategory('Luxury Handbags'); }}>Luxury Handbags</a></li>
                <li><a href="#" onClick={e => { e.preventDefault(); onFilterCategory && onFilterCategory('Clutches'); }}>Clutches</a></li>
                <li><a href="#" onClick={e => { e.preventDefault(); onFilterCategory && onFilterCategory('Backpacks'); }}>Backpacks</a></li>
                <li><Link to="/cart">Your Bag</Link></li>
                <li>
                  <button
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(250,245,239,0.6)', padding: '5px 14px', marginTop: '6px', borderRadius: '2px', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", fontSize: '0.75rem', transition: 'all 0.2s ease' }}
                    onMouseOver={e => { e.target.style.color = '#FAF5EF'; e.target.style.borderColor = 'rgba(255,255,255,0.5)'; }}
                    onMouseOut={e => { e.target.style.color = 'rgba(250,245,239,0.6)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                    onClick={() => window.location.href = '/auth'}
                  >Track Order</button>
                </li>
              </ul>
            </div>

            {/* Contact column */}
            <div className="footer-column">
              <h3>Contact</h3>
              <ul style={{ color: 'rgba(250,245,239,0.55)', fontSize: '0.82rem', lineHeight: 2.2, fontWeight: 300 }}>
                <li>Nairobi, Kenya</li>
                <li>+254 (0) 712 345 678</li>
                <li><a href="mailto:concierge@rueandkay.com">concierge@rueandkay.com</a></li>
                <li><a href="#" onClick={e => { e.preventDefault(); setShowContact(true); }}>Contact Us →</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-legal-base">
            <div className="copyright-notice">© 2026 Rue and Kay Atelier. All rights reserved.</div>
            <div className="legal-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Returns</a>
            </div>
          </div>
        </div>
      ) : (
        <div id="footerContactPanels" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 0', position: 'relative', animation: 'pdmFadeIn 0.4s ease' }}>
          <button
            onClick={() => setShowContact(false)}
            style={{ position: 'absolute', top: '-10px', right: 0, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#FAF5EF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', textAlign: 'center', fontFamily: "'Poppins', sans-serif", marginTop: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', borderRight: '1px solid rgba(201,169,110,0.2)', paddingRight: '20px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <h4 style={{ margin: '4px 0', fontSize: '0.7rem', textTransform: 'uppercase', color: '#FAF5EF', letterSpacing: '2px', fontWeight: 600 }}>Call Us</h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(250,245,239,0.5)', maxWidth: '220px', lineHeight: 1.5 }}>Reach our concierge client services desk directly for immediate assistance.</p>
              <a href="tel:+254712345678" style={{ fontSize: '0.88rem', color: '#FAF5EF', fontWeight: 600, textDecoration: 'none' }}>+254 (0) 712 345 678</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <h4 style={{ margin: '4px 0', fontSize: '0.7rem', textTransform: 'uppercase', color: '#FAF5EF', letterSpacing: '2px', fontWeight: 600 }}>Email Us</h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(250,245,239,0.5)', maxWidth: '220px', lineHeight: 1.5 }}>Drop our support studio a line and we'll reply within 12 business hours.</p>
              <a href="mailto:concierge@rueandkay.com" style={{ fontSize: '0.88rem', color: '#FAF5EF', fontWeight: 600, textDecoration: 'none' }}>concierge@rueandkay.com</a>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
