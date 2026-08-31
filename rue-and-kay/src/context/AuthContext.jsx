import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) loadWishlist(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadWishlist(session.user.id);
      } else {
        setWishlistIds(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadWishlist(userId) {
    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', userId);
    if (!error && data) {
      setWishlistIds(new Set(data.map(r => r.product_id)));
    }
  }

  async function toggleWishlist(productId) {
    if (!user) return false; // caller should redirect to /auth
    const isSaved = wishlistIds.has(productId);
    if (isSaved) {
      setWishlistIds(prev => { const s = new Set(prev); s.delete(productId); return s; });
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
    } else {
      setWishlistIds(prev => new Set([...prev, productId]));
      await supabase.from('wishlists').insert([{ user_id: user.id, product_id: productId }]);
    }
    return !isSaved;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, wishlistIds, toggleWishlist, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
