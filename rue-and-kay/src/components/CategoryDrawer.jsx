// CategoryDrawer — slides in from the left/right with category list
export default function CategoryDrawer({ isOpen, onClose, onFilter }) {
  const categories = [
    { label: 'Show All', value: 'all' },
    { label: 'Luxury Handbags', value: 'Luxury Handbags' },
    { label: 'Clutches', value: 'Clutches' },
    { label: 'Backpacks', value: 'Backpacks' },
  ];

  const handleFilter = (value) => {
    onFilter(value);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="categoryMenuOverlay"
      className="cmo-backdrop"
      onClick={onClose}
      style={{ display: 'block', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(26,10,14,0.6)', zIndex: 4000 }}
    >
      <div
        className="luxury-mobile-drawer"
        onClick={e => e.stopPropagation()}
        style={{ position: 'absolute', top: 0, right: 0, width: '85vw', maxWidth: '360px', height: '100%', background: '#EBE5E0', boxShadow: '-8px 0 40px rgba(26,10,14,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px 20px' }}
      >
        {/* Drawer header */}
        <div style={{ background: '#180D11', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '72px', flexShrink: 0, borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            <span style={{ color: '#FAF5EF', fontFamily: "'Stalemate', cursive", fontSize: '1.9rem', fontWeight: 400, letterSpacing: '1px', lineHeight: 1, transform: 'translateY(2px)', display: 'inline-block' }}>Rue and Kay</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#25161B', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', color: '#FAF5EF', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', borderRadius: '50%', transition: 'background 0.2s ease' }}
          >✕</button>
        </div>

        {/* Eyebrow */}
        <div style={{ padding: '32px 0 12px 4px' }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.65rem', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#9B4E63', margin: 0 }}>Browse Categories</p>
        </div>

        {/* Category list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {categories.map((cat, i) => (
            <button
              key={cat.value}
              className="drawer-filter-btn"
              onClick={() => handleFilter(cat.value)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '16px 20px', background: i === 0 ? '#F4EBEF' : 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", fontSize: '0.95rem', fontWeight: i === 0 ? 600 : 400, color: '#180D11', textAlign: 'left', boxSizing: 'border-box', borderRadius: '2px' }}
            >
              <span>{cat.label}</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 300, color: i === 0 ? '#9B4E63' : '#888' }}>+</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
