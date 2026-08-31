import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, wishlistIds, toggleWishlist } = useAuth();

  const isSaved = wishlistIds.has(product.id);

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    await toggleWishlist(product.id);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!product.sold_out) addToCart(product);
  };

  return (
    <div
      className="product-card visible"
      onClick={() => navigate(`/product/${product.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="image-placeholder" style={{ position: 'relative' }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} />
          : <span style={{ fontSize: '3rem', color: '#ccc' }}>👜</span>
        }
        {product.sold_out && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#dc2626', color: '#fff', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', pointerEvents: 'none', zIndex: 2 }}>
            Sold Out
          </div>
        )}
        <button
          className="icon-wishlist-btn"
          title={isSaved ? 'Remove from Wishlist' : 'Save to Wishlist'}
          onClick={handleWishlist}
          style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(250,245,239,0.9)', border: 'none', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s ease', zIndex: 2, padding: 0 }}
        >
          <svg className="heart-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill={isSaved ? '#C2185B' : 'none'} stroke="#9B4E63" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div className="product-info">
        <h3 className="product-card-title">{product.name}</h3>
        <h4 className="product-card-desc">{product.description || 'Exclusive Atelier collection piece.'}</h4>
        <p className="product-card-price">KES {Number(product.price).toLocaleString()}</p>
      </div>
      <div className="product-card-footer">
        <button
          className="icon-cart-btn"
          title="Add to Bag"
          disabled={!!product.sold_out}
          onClick={handleAddToCart}
          style={product.sold_out ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
        >
          <span className="material-symbols-outlined">shopping_bag</span>
          Add to Bag
        </button>
      </div>
    </div>
  );
}
