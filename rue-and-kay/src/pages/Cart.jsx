import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CategoryDrawer from '../components/CategoryDrawer';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user, toggleWishlist } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  // Load products for the empty state "Continue Browsing" grid
  useEffect(() => {
    if (cart.length === 0) {
      supabase.from('products').select('*').limit(4).then(({ data }) => {
        if (data) setSuggestedProducts(data);
      });
    }
  }, [cart.length]);

  const handleMoveToWishlist = async (item) => {
    if (!user) {
      navigate(`/auth?returnTo=/cart`);
      return;
    }
    await toggleWishlist(item.id);
    removeFromCart(item.id);

    // Toast notification
    const toast = document.createElement('div');
    toast.innerText = `♥ "${item.name}" moved to your Wishlist`;
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#C2185B;color:#fff;padding:12px 24px;border-radius:8px;font-family:Poppins,sans-serif;font-size:0.9rem;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  return (
    <>
      <Navbar onMenuOpen={setDrawerOpen} />
      <CategoryDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onFilter={() => { navigate('/'); setDrawerOpen(false); }} />

      <main style={{ maxWidth: '1200px', margin: '120px auto 80px auto', padding: '0 20px', minHeight: '50vh' }}>

        {/* EMPTY STATE */}
        {cart.length === 0 && (
          <div id="emptyCartView" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 400, marginBottom: '10px', color: 'var(--text-main)', fontFamily: "'Cormorant Garamond', serif" }}>Your shopping bag is empty</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '40px', letterSpacing: '0.3px' }}>You currently don't have any items in your shopping bag.</p>

            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.65rem', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '24px' }}>Continue Browsing</p>

            <div id="emptyCartProductGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', maxWidth: '900px', margin: '0 auto 40px auto', textAlign: 'left' }}>
              {suggestedProducts.map(item => (
                <div key={item.id} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => navigate(`/product/${item.id}`)}>
                  <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--accent-light)', overflow: 'hidden', borderRadius: '2px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>🛍️</span>
                    }
                  </div>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.62rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '3px' }}>{item.category || 'Collection'}</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.3, marginBottom: '4px' }}>{item.name}</span>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.82rem', color: 'var(--text-muted)' }}>KES {Number(item.price).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'var(--bg-dark)', color: '#FAF5EF', padding: '14px 32px', textDecoration: 'none', fontFamily: "'Poppins', sans-serif", fontSize: '0.78rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', borderRadius: '2px', transition: 'background 0.25s' }}>
              Shop All →
            </Link>
          </div>
        )}

        {/* FILLED STATE */}
        {cart.length > 0 && (
          <div id="filledCartView">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 400, margin: 0, color: 'var(--text-main)', fontFamily: "'Cormorant Garamond', serif" }}>Your shopping bag</h1>
              <button id="checkoutBtnDesktop" onClick={() => navigate('/checkout')} style={{ background: 'var(--bg-dark)', color: '#FAF5EF', padding: '15px 40px', border: 'none', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.25s', fontFamily: "'Poppins', sans-serif" }}>
                Proceed to checkout
              </button>
            </div>

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: '20px', borderBottom: '2px solid var(--accent-gold)', paddingBottom: '10px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.72rem' }}>
              <div>Your items</div>
              <div style={{ textAlign: 'center' }}>Price</div>
              <div style={{ textAlign: 'center' }}>Quantity</div>
              <div style={{ textAlign: 'right' }}>Subtotal</div>
            </div>

            {/* Cart rows */}
            <div id="cartPageItemsGrid">
              {cart.map((item, index) => {
                const qty = item.quantity || 1;
                const subtotal = Number(item.price) * qty;
                return (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: '20px', alignItems: 'center', padding: '30px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ width: '120px', height: '150px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '2px' }}>
                        {item.image_url && <img className="cp-image" src={item.image_url} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '5px' }}>Rue and Kay</div>
                        <div className="cp-name" style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '5px' }}>{item.name}</div>
                        <div className="cp-id" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Item No.: RK-{item.id}</div>
                      </div>
                    </div>
                    <div className="cp-price" style={{ fontWeight: 500, textAlign: 'center' }}>KES {Number(item.price).toLocaleString()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                      <button className="cp-minus-btn" onClick={() => updateQuantity(item.id, -1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}>−</button>
                      <span className="cp-qty" style={{ fontWeight: 500 }}>{qty}</span>
                      <button className="cp-plus-btn" onClick={() => updateQuantity(item.id, 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '40px' }}>
                      <div className="cp-subtotal" style={{ fontWeight: 600 }}>KES {subtotal.toLocaleString()}</div>
                      <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem' }}>
                        <span className="cp-wishlist-btn" style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--accent)' }} onClick={() => handleMoveToWishlist(item)}>♡ Move to wishlist</span>
                        <span className="cp-remove-btn" style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--accent)' }} onClick={() => removeFromCart(item.id)}>Remove</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile checkout button */}
            <button id="checkoutBtnMobile" onClick={() => navigate('/checkout')} style={{ display: 'none', width: '100%', background: 'var(--bg-dark)', color: '#FAF5EF', padding: '15px', border: 'none', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '20px', fontFamily: "'Poppins', sans-serif" }}>
              Proceed to checkout
            </button>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <input type="text" placeholder="Gift Card / Promo Code *" style={{ padding: '12px', width: '300px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-main)', fontFamily: "'Poppins', sans-serif" }} />
                <button style={{ padding: '12px 25px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", transition: 'all 0.2s' }}>Use code</button>
              </div>
              <div style={{ width: '350px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
                  <span>Subtotal:</span>
                  <span id="pageSubtotalValue" style={{ fontWeight: 600 }}>KES {cartTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.95rem' }}>
                  <span>Free Shipping:</span>
                  <span style={{ fontWeight: 600 }}>KES 0.00</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Grand Total:</span>
                  <span id="pageGrandTotalValue" style={{ fontWeight: 700, fontSize: '1.1rem' }}>KES {cartTotal.toLocaleString()}</span>
                </div>
                <p style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Estimated taxes and duties will be calculated at checkout.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
