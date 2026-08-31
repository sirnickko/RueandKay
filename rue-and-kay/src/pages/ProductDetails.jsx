import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CategoryDrawer from '../components/CategoryDrawer';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, wishlistIds, toggleWishlist } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImg, setMainImg] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (!error && data) {
        setProduct(data);
        setMainImg(data.image_url || '');
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  const handleAdd = () => {
    if (product && !product.sold_out) {
      addToCart(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      navigate(`/auth?returnTo=/product/${id}`);
      return;
    }
    await toggleWishlist(product.id);
  };

  if (loading) return <div style={{ padding: '200px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;
  if (!product) return <div style={{ padding: '200px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>Product not found.</div>;

  const isSaved = wishlistIds.has(product.id);
  const thumbs = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean);

  return (
    <>
      <Navbar onMenuOpen={setDrawerOpen} />
      <CategoryDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onFilter={() => { navigate('/'); setDrawerOpen(false); }} />

      <main className="product-detail-main">
        {/* Gallery */}
        <div className="product-gallery">
          <div className="main-image-frame">
            {mainImg
              ? <img src={mainImg} alt={product.name} />
              : <span style={{ fontSize: '5rem', color: '#ccc' }}>👜</span>
            }
          </div>
          {thumbs.length > 1 && (
            <div className="thumbnail-strip">
              {thumbs.map((src, i) => (
                <div
                  key={i}
                  className={`thumb-frame${mainImg === src ? ' active' : ''}`}
                  onClick={() => setMainImg(src)}
                >
                  <img src={src} alt={`View ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="product-details-col">
          <p className="detail-category-label">{product.category || 'Atelier Collection'}</p>
          <h1 className="detail-product-name">{product.name}</h1>
          <div className="detail-price">KES {Number(product.price).toLocaleString()}</div>

          <p className="detail-description">{product.description || 'Classy all time item with elegant structures. Handpicked styling configurations crafted from premium selections.'}</p>

          <div className="detail-actions">
            {product.sold_out ? (
              <button className="add-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Sold Out</button>
            ) : (
              <button className="add-btn" onClick={handleAdd}>
                {added ? '✓ Added to Bag!' : 'Add to Bag'}
              </button>
            )}
            <button
              className="wishlist-outline-btn"
              onClick={handleWishlist}
              style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', color: isSaved ? '#C2185B' : 'var(--accent)', padding: '13px', borderRadius: '2px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem', letterSpacing: '0.5px', marginTop: '10px', transition: 'all 0.2s ease' }}
            >
              {isSaved ? '♥ Saved to Wishlist' : '♡ Save to Wishlist'}
            </button>
          </div>

          <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

          <div className="detail-info-block">
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', marginBottom: '10px' }}>About this piece</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {product.description || 'A masterfully crafted piece from the Rue and Kay Atelier collection, made with premium materials and unmatched attention to detail.'}
            </p>
          </div>

          <div style={{ marginTop: '30px' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
