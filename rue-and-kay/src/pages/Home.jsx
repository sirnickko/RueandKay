import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CategoryDrawer from '../components/CategoryDrawer';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

const CATEGORIES = ['all', 'Luxury Handbags', 'Clutches', 'Backpacks'];

// Quick-view modal
function QuickViewModal({ product, onClose, onAddToCart }) {
  const [mainImg, setMainImg] = useState(product?.image_url || '');

  useEffect(() => {
    if (product) setMainImg(product.image_url || '');
  }, [product]);

  if (!product) return null;

  const thumbs = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean);

  return (
    <div className="pdm-overlay" onClick={onClose} style={{ display: 'flex' }}>
      <div className="pdm-window" onClick={e => e.stopPropagation()}>
        <button className="pdm-close-btn" onClick={onClose}>✕</button>
        <div className="pdm-content-layout">
          <div className="pdm-gallery-side">
            <div className="pdm-main-frame">
              <img id="pdmMainImage" src={mainImg} alt={product.name} />
            </div>
            {thumbs.length > 0 && (
              <div className="pdm-carousel-ribbon">
                <button className="pdm-arrow">&lt;</button>
                <div className="pdm-thumbnails">
                  {thumbs.map((src, i) => (
                    <img key={i} className="pdm-thumb" src={src} alt={`View ${i + 1}`} onClick={() => setMainImg(src)} />
                  ))}
                </div>
                <button className="pdm-arrow">&gt;</button>
              </div>
            )}
          </div>
          <div className="pdm-details-side">
            <p id="pdmBrand" className="pdm-brand-title">{product.category || 'Handbags'}</p>
            <h2 id="pdmName" className="pdm-product-tagline">{product.name}</h2>
            <div id="pdmPrice" className="pdm-price-label">{Number(product.price).toLocaleString()} ksh</div>
            <button id="pdmAddBtn" className="pdm-primary-add" onClick={() => { onAddToCart(product); onClose(); }}>Add to Bag</button>
            <button className="pdm-fav-btn">
              Save to Wishlist &nbsp;<span className="material-symbols-outlined" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>favorite</span>
            </button>
            <hr className="pdm-divider" />
            <div className="pdm-info-block">
              <h3>About this piece</h3>
              <p id="pdmDesc">{product.description || 'Classy all time item with elegant structures. Handpicked styling configurations crafted from premium selections.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const heroImgRef = useRef(null);
  const heroIdxRef = useRef(0);
  const heroIntervalRef = useRef(null);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
      if (!error && data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // Hero carousel
  useEffect(() => {
    if (products.length === 0) return;
    const validImages = products.map(p => p.image_url).filter(Boolean);
    if (validImages.length === 0) return;

    const el = heroImgRef.current;
    if (el) el.src = validImages[0];

    heroIntervalRef.current = setInterval(() => {
      if (!el) return;
      el.style.opacity = '0';
      setTimeout(() => {
        heroIdxRef.current = (heroIdxRef.current + 1) % validImages.length;
        el.src = validImages[heroIdxRef.current];
        el.style.opacity = '1';
      }, 600);
    }, 3000);

    return () => clearInterval(heroIntervalRef.current);
  }, [products]);

  // Filtered products
  const filtered = products.filter(p => {
    const matchCat = category === 'all' || p.category === category || p.collection === category || (p.brand && p.brand === category);
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const scrollToProducts = () => {
    document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Navbar onMenuOpen={setDrawerOpen} />
      <CategoryDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onFilter={setCategory} />

      {/* Category nav bar */}
      <nav id="categoryNavBar" style={{ position: 'fixed', left: 0, width: '100%', zIndex: 900, background: 'var(--header-bg)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--header-border)', top: '72px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-nav-btn${category === cat ? ' active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat === 'all' ? 'All' : cat} <span className="cat-chevron">⌄</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Hero section */}
      <section className="hero-section" style={{ marginTop: '72px' }}>
        <div className="hero-image-panel">
          <img
            id="heroDynamicImage"
            ref={heroImgRef}
            src=""
            alt="Rue and Kay Atelier — Featured Collection"
            style={{ opacity: 1, transition: 'opacity 0.8s ease-in-out' }}
          />
          <div className="hero-vignette"></div>
        </div>
        <div className="hero-content-center">
          <div className="hero-glass-panel">
            <span className="hero-eyebrow">Nairobi · New Collection</span>
            <h1 className="hero-headline">Crafted<br />for the <em>Bold.</em></h1>
            <p className="hero-subtext">Handmade luxury bags, clutches and backpacks — designed in Nairobi, worn worldwide.</p>
            <button className="hero-cta" onClick={scrollToProducts}>
              Shop the Collection <span className="hero-cta-arrow">→</span>
            </button>
          </div>
        </div>
        <div className="hero-gold-line"></div>
      </section>

      {/* Products section */}
      <main id="productsSection" className="storefront-main">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">The Collection</p>
            <h2 className="section-title">Our <em>Products</em></h2>
          </div>
          <a href="#" onClick={e => { e.preventDefault(); setCategory('all'); }} className="section-see-all">
            View All &nbsp;→
          </a>
        </div>

        <section id="productsGrid" className="shop-container" style={{ marginTop: '10px' }}>
          {loading && (
            <p style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading products…</p>
          )}
          {!loading && filtered.length === 0 && (
            <p style={{ padding: '20px', color: 'var(--text-muted)' }}>No products found matching this selector.</p>
          )}
          {!loading && filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      </main>

      <Footer onFilterCategory={setCategory} />

      {/* Quick-view modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={addToCart}
        />
      )}
    </>
  );
}
