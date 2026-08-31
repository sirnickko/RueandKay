import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ─── Upload helper ───────────────────────────────────────────────────────────
async function uploadFileOrUrl(fileInput, fallbackUrl) {
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const uniqueName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(uniqueName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('product-images').getPublicUrl(uniqueName);
    return data.publicUrl;
  }
  return fallbackUrl || null;
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────
function EditModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product.name || '',
    price: product.price || '',
    category: product.category || '',
    description: product.description || '',
    image_url: product.image_url || '',
    image_url_2: product.image_url_2 || '',
    image_url_3: product.image_url_3 || '',
  });
  const [status, setStatus] = useState({ msg: '', type: '' });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setStatus({ msg: 'Saving...', type: 'loading' });
    const payload = { ...form, price: Number(form.price) };
    const { error } = await supabase.from('products').update(payload).eq('id', product.id);
    if (error) { setStatus({ msg: '✕ ' + error.message, type: 'error' }); return; }
    setStatus({ msg: '✓ Saved!', type: 'success' });
    setTimeout(() => { onClose(); onSaved(); }, 800);
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ position: 'relative' }}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>Edit Product</h3>
        <p className="modal-sub">Changes save instantly to the live storefront.</p>

        {[
          { label: 'Product Name', key: 'name', type: 'text' },
          { label: 'Price (KES)', key: 'price', type: 'number' },
          { label: 'Category', key: 'category', type: 'text' },
          { label: 'Description', key: 'description', type: 'text' },
          { label: 'Primary Image URL', key: 'image_url', type: 'url' },
          { label: 'Image 2 URL (optional)', key: 'image_url_2', type: 'url' },
          { label: 'Image 3 URL (optional)', key: 'image_url_3', type: 'url' },
        ].map(({ label, key, type }) => (
          <div className="form-group" key={key}>
            <label htmlFor={`edit-${key}`}>{label}</label>
            <input type={type} id={`edit-${key}`} value={form[key]} onChange={e => update(key, e.target.value)} />
          </div>
        ))}

        <div className="modal-actions">
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="modal-save-btn" onClick={save}>Save Changes</button>
        </div>
        {status.msg && (
          <div id="editStatusMsg" className={`status-msg visible ${status.type}`} style={{ marginTop: '14px' }}>{status.msg}</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin component ────────────────────────────────────────────────────
export default function Admin() {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Add product form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [urlInputs, setUrlInputs] = useState({ img1: '', img2: '', img3: '' });
  const [addStatus, setAddStatus] = useState({ msg: '', type: '' });
  const [submitting, setSubmitting] = useState(false);

  // Product table
  const [products, setProducts] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);

  // Edit modal
  const [editProduct, setEditProduct] = useState(null);

  async function loadProducts() {
    setTableLoading(true);
    const { data, error } = await supabase.from('products').select('id,name,price,category,image_url,sold_out').order('id', { ascending: true });
    if (!error && data) setProducts(data);
    setTableLoading(false);
  }

  useEffect(() => {
    if (user) loadProducts();
  }, [user]);

  // Auth guard (after hooks)
  if (loading) return <div style={{ padding: '200px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>Checking session…</div>;
  if (!user) return <Navigate to="/auth?returnTo=/admin" replace />;

  async function handleAddProduct(e) {
    e.preventDefault();
    setSubmitting(true);
    setAddStatus({ msg: 'Uploading images...', type: 'loading' });

    try {
      const file1 = document.getElementById('prodFile');
      const file2 = document.getElementById('prodFile2');
      const file3 = document.getElementById('prodFile3');

      const finalUrl1 = await uploadFileOrUrl(file1, urlInputs.img1);
      const finalUrl2 = await uploadFileOrUrl(file2, urlInputs.img2);
      const finalUrl3 = await uploadFileOrUrl(file3, urlInputs.img3);

      setAddStatus({ msg: 'Saving product entry to database...', type: 'loading' });

      const { error } = await supabase.from('products').insert([{
        name, price: Number(price), image_url: finalUrl1,
        image_url_2: finalUrl2, image_url_3: finalUrl3,
        category: category || null, description: description || null,
      }]);

      if (error) throw error;

      setAddStatus({ msg: '✓ Product successfully added to the shop', type: 'success' });
      setName(''); setPrice(''); setCategory(''); setDescription('');
      setUrlInputs({ img1: '', img2: '', img3: '' });
      e.target.reset();
      setTimeout(loadProducts, 1500);

    } catch (err) {
      console.error('Operation failed:', err.message);
      setAddStatus({ msg: '✕ Error: ' + err.message, type: 'error' });
    }
    setSubmitting(false);
  }

  async function toggleSoldOut(id, currentStatus) {
    const { error } = await supabase.from('products').update({ sold_out: !currentStatus }).eq('id', id);
    if (error) { alert('Update failed: ' + error.message); return; }
    loadProducts();
  }

  async function deleteProduct(id, pName) {
    if (!window.confirm(`Delete "${pName}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { alert('Delete failed: ' + error.message); return; }
    loadProducts();
  }

  const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
  const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );

  return (
    <>
      {/* Admin Header */}
      <header className="admin-header">
        <nav className="admin-nav" style={{ position: 'relative' }}>
          <div className="admin-nav-left">
            <Link to="/" className="nav-link-pill">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              View Store
            </Link>
          </div>
          <Link to="/" className="admin-logo">Rue and Kay <span>Atelier.</span></Link>
          <div className="admin-nav-right">
            <button className="admin-theme-btn" id="themeToggleBtn" onClick={toggleTheme} title="Toggle Dark Mode">
              {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
            </button>
            <button id="logoutBtn" className="nav-link-pill logout-pill" onClick={signOut}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </nav>
      </header>

      {/* Add Product Card */}
      <div className="admin-page">
        <div className="admin-card">
          <div className="admin-badge">Admin Panel</div>
          <h2>Add New Product</h2>
          <p className="card-subtitle">Upload a new item to the live storefront inventory.</p>
          <div className="form-divider"></div>

          <form id="addProductForm" onSubmit={handleAddProduct}>
            <div className="form-group">
              <label htmlFor="prodName">Product Name</label>
              <input type="text" id="prodName" placeholder="e.g., Luxury Leather Handbag" required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="prodPrice">Price (KES)</label>
              <input type="number" id="prodPrice" placeholder="e.g., 3500" required value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="prodCategory">Category</label>
              <input type="text" id="prodCategory" placeholder="e.g., Luxury Handbags, Clutches, Back Packs" value={category} onChange={e => setCategory(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="prodDescription">Short Description</label>
              <input type="text" id="prodDescription" placeholder="e.g., A pink leather hand purse with gold trim" value={description} onChange={e => setDescription(e.target.value)} />
              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '5px', display: 'block' }}>Shown on the product card and product page.</span>
            </div>

            {/* Image inputs */}
            <div className="form-group">
              <div className="image-source-box">
                <span className="section-label">Product Image Source</span>
                {[
                  { fileId: 'prodFile', urlKey: 'img1', urlId: 'prodImage', label: 'Product Image Source', urlPlaceholder: 'https://example.com/image.jpg' },
                  { fileId: 'prodFile2', urlKey: 'img2', urlId: 'prodImage2', label: 'Image 2 — Optional', urlPlaceholder: 'https://example.com/image2.jpg' },
                  { fileId: 'prodFile3', urlKey: 'img3', urlId: 'prodImage3', label: 'Image 3 — Optional', urlPlaceholder: 'https://example.com/image3.jpg' },
                ].map((img, i) => (
                  <div key={img.fileId} style={i > 0 ? { marginTop: '16px' } : {}}>
                    {i > 0 && <div className="or-divider" style={{ marginTop: '16px' }}>{img.label}</div>}
                    <span className="option-label">Option 1 — Upload from device</span>
                    <input type="file" id={img.fileId} accept="image/*" style={i > 0 ? { marginBottom: '10px' } : {}} />
                    <div className="or-divider">OR</div>
                    <span className="option-label">Option 2 — Paste image URL</span>
                    <input type="url" id={img.urlId} placeholder={img.urlPlaceholder}
                      value={urlInputs[img.urlKey]}
                      onChange={e => setUrlInputs(u => ({ ...u, [img.urlKey]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Uploading…' : 'Upload to Database'}
            </button>
          </form>

          {addStatus.msg && (
            <div id="statusMessage" className={`status-msg visible ${addStatus.type}`}>{addStatus.msg}</div>
          )}
        </div>
      </div>

      {/* Manage Products Table */}
      <div className="manage-card">
        <div className="admin-card" style={{ maxWidth: '100%' }}>
          <h2>Manage Products</h2>
          <p className="card-subtitle">Edit details, mark as sold out, or remove items from the shop.</p>
          <div className="form-divider"></div>

          <div id="productTableWrapper">
            {tableLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading products...</p>
            ) : products.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No products yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="product-table">
                  <thead>
                    <tr>
                      <th></th><th>Name</th><th>Price</th><th>Category</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} id={`prod-row-${p.id}`}>
                        <td>
                          {p.image_url
                            ? <img className="tbl-thumb" src={p.image_url} alt={p.name} />
                            : <div className="tbl-thumb-placeholder">👜</div>
                          }
                        </td>
                        <td style={{ fontWeight: 500, maxWidth: '180px' }}>{p.name}</td>
                        <td>KES {Number(p.price).toLocaleString()}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{p.category || '—'}</td>
                        <td>
                          {p.sold_out
                            ? <span className="sold-out-pill">Sold Out</span>
                            : <span className="in-stock-pill">In Stock</span>
                          }
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button className="action-btn edit-btn" onClick={() => setEditProduct(p)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit
                            </button>
                            <button
                              className={`action-btn sold-btn${p.sold_out ? ' active' : ''}`}
                              id={`sold-btn-${p.id}`}
                              onClick={() => toggleSoldOut(p.id, !!p.sold_out)}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                              </svg>
                              {p.sold_out ? 'Mark In Stock' : 'Mark Sold Out'}
                            </button>
                            <button className="action-btn del-btn" onClick={() => deleteProduct(p.id, p.name)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6"/><path d="M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <EditModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSaved={loadProducts}
        />
      )}
    </>
  );
}
