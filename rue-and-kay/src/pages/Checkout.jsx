import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import CategoryDrawer from '../components/CategoryDrawer';

const WHATSAPP_NUMBER = '254748184217';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Delivery form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('Nairobi');
  const [phone, setPhone] = useState('');

  // Payment
  const [payMethod, setPayMethod] = useState('mpesa');

  // Status
  const [statusMsg, setStatusMsg] = useState('');
  const [statusColor, setStatusColor] = useState('#666');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) navigate('/cart');
  }, [cart, navigate]);

  // Generate order ID
  const genOrderId = () => 'ORD-' + Math.floor(Math.random() * 1000000);

  async function logOrder(status, ref, method) {
    const { error } = await supabase.from('orders').insert([{
      customer_name: `${firstName} ${lastName}`,
      phone_number: phone,
      delivery_location: location,
      cart_items: cart,
      total_price: cartTotal,
      payment_method: method,
      payment_status: status,
      mpesa_receipt: ref,
    }]);
    if (error) throw error;
  }

  function triggerWhatsApp(method) {
    const itemsText = cart.map((item, i) => `${i + 1}. ${item.name} (Qty: ${item.quantity || 1})`).join('\n');
    const msg = `Hello *Rue and Kay Atelier*,\n\n🛍️ *NEW ORDER PLACED!*\n---------------------------\n👤 *Customer:* ${firstName} ${lastName}\n📞 *Contact:* ${phone}\n📍 *Delivery Location:* ${location}\n💳 *Payment Method:* ${method}\n\n📦 *Items Requested:*\n${itemsText}\n\n💰 *Total Amount:* KES ${cartTotal.toLocaleString()}\n---------------------------\n🚚 *Estimated Delivery:* 24 to 48 hours.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    clearCart();
    setTimeout(() => { window.location.href = url; }, 2000);
  }

  async function handlePlaceOrder() {
    if (!firstName || !lastName || !location || !phone) {
      alert('Please fill out all required shipping fields to secure your order.');
      return;
    }
    setSubmitting(true);
    setStatusMsg('Processing order details securely...');
    setStatusColor('#666666');

    try {
      const orderId = genOrderId();

      if (payMethod === 'mpesa') {
        setStatusMsg('Initiating M-Pesa STK Push... Please check your phone.');
        setStatusColor('#040404');

        const { error: pushError } = await supabase.functions.invoke('mpesa_stk_push', {
          body: { phoneNumber: phone, totalAmount: cartTotal, orderId }
        });
        if (pushError) throw pushError;

        await logOrder('Pending', orderId, 'M-Pesa');
        setStatusMsg('M-Pesa prompt sent! Confirming with WhatsApp…');
        setStatusColor('#059669');
        triggerWhatsApp('M-Pesa');

      } else if (payMethod === 'card') {
        // Paystack
        setStatusMsg('Opening secure payment gateway...');
        setStatusColor('#000000');
        const customerEmail = `${phone.replace(/\+/g, '')}@rueandkay.com`;

        // Dynamically load Paystack
        if (!window.PaystackPop) {
          const script = document.createElement('script');
          script.src = 'https://js.paystack.co/v1/inline.js';
          document.head.appendChild(script);
          await new Promise(resolve => { script.onload = resolve; });
        }

        const handler = window.PaystackPop.setup({
          key: 'sk_test_6fd66dc4b3af626cdf7ee7e3dc4606a69167f064',
          email: customerEmail,
          amount: cartTotal * 100,
          currency: 'KES',
          ref: orderId,
          onClose: () => {
            setStatusMsg('Payment window closed. Transaction cancelled.');
            setStatusColor('#dc2626');
            setSubmitting(false);
          },
          callback: async (response) => {
            setStatusMsg('Payment Successful! Securing your order...');
            setStatusColor('#0f100f');
            await logOrder('Paid', response.reference, 'Card');
            triggerWhatsApp('Card');
          }
        });
        handler.openIframe();
        return; // Don't set submitting = false yet
      }
    } catch (err) {
      console.error('Checkout breakdown:', err.message);
      setStatusMsg('Transaction failed: ' + err.message);
      setStatusColor('#dc2626');
    }
    setSubmitting(false);
  }

  return (
    <>
      <Navbar onMenuOpen={setDrawerOpen} />
      <CategoryDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onFilter={() => { navigate('/'); setDrawerOpen(false); }} />

      <main style={{ maxWidth: '1200px', margin: '110px auto 60px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '58% 38%', gap: '4%', alignItems: 'start' }}>

        {/* LEFT: Delivery + Payment */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

          {/* Delivery Information */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '30px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontFamily: "'Poppins', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Delivery Information</h3>
            <div id="checkoutDeliveryForm" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-muted)' }}>First Name</label>
                  <input id="chkFirstName" type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text-main)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-muted)' }}>Last Name</label>
                  <input id="chkLastName" type="text" required value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text-main)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-muted)' }}>Delivery Address / Building Name</label>
                <input id="chkLocation" type="text" required value={location} onChange={e => setLocation(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-muted)' }}>City</label>
                  <input id="chkCity" type="text" value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text-main)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-muted)' }}>Phone Number</label>
                  <input id="chkPhone" type="tel" placeholder="e.g. 0712345678" required value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text-main)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '30px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontFamily: "'Poppins', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Payment Method</h3>

            {[
              { id: 'mpesa', label: 'M-Pesa (STK Push)', badge: 'Lipa Na M-Pesa', badgeColor: '#059669' },
              { id: 'card', label: 'Credit / Debit Card', badge: '💳', badgeColor: 'inherit' },
              { id: 'paypal', label: 'PayPal', badge: 'PayPal', badgeColor: '#003087' },
            ].map(method => (
              <label
                key={method.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: `1px solid ${payMethod === method.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '10px', cursor: 'pointer', fontWeight: 500, color: 'var(--text-main)', background: payMethod === method.id ? 'var(--accent-light)' : 'var(--card-bg)', transition: 'all 0.2s ease', marginBottom: '12px' }}
                onClick={() => setPayMethod(method.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="radio" name="paymentType" id={`pay${method.id}`} checked={payMethod === method.id} onChange={() => setPayMethod(method.id)} style={{ accentColor: 'var(--accent)' }} />
                  <span>{method.label}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: method.badgeColor, fontWeight: 600, fontStyle: method.id === 'paypal' ? 'italic' : 'normal' }}>{method.badge}</span>
              </label>
            ))}

            {payMethod === 'mpesa' && (
              <div id="mpesaDetailsSubForm" style={{ display: 'block', marginTop: '15px', padding: '15px', background: 'var(--accent-light)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span style={{ color: '#059669', fontWeight: 600, marginRight: '4px' }}>STK Push Live:</span>
                An automated STK PIN prompt will be sent instantly to the phone number specified above upon clicking Place Order.
              </div>
            )}
            {payMethod === 'card' && (
              <div id="cardDetailsSubForm" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-muted)' }}>Card Number</label>
                  <input id="chkCardNumber" type="text" placeholder="1234 5678 9012 3456" style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text-main)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-muted)' }}>Expiry Date</label>
                    <input id="chkCardExpiry" type="text" placeholder="MM/YY" style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-muted)' }}>CVC</label>
                    <input id="chkCardCvc" type="text" placeholder="123" style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text-main)' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: Order Summary */}
        <section style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '30px', position: 'sticky', top: '100px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Order Summary</h3>

          <div id="checkoutSummaryList" style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
            {cart.map(item => {
              const qty = item.quantity || 1;
              const line = Number(item.price) * qty;
              return (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', borderBottom: '1px solid #f9fafb', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={item.image_url || ''} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#000' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Qty: {qty}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 500, color: '#000' }}>KES {line.toLocaleString()}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <span id="chkSubtotal" style={{ color: 'var(--text-main)', fontWeight: 500 }}>KES {cartTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Shipping Delivery</span>
              <span style={{ color: '#059669', fontWeight: 600 }}>FREE</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem', color: 'var(--accent)', marginBottom: '25px' }}>
            <span style={{ color: 'var(--text-main)' }}>Total Due</span>
            <span id="chkTotal">KES {cartTotal.toLocaleString()}</span>
          </div>

          <button
            id="chkPlaceOrderBtn"
            onClick={handlePlaceOrder}
            disabled={submitting}
            style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%)', color: '#ffffff', border: 'none', padding: '15px', borderRadius: '30px', fontWeight: 600, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer', letterSpacing: '0.5px', transition: 'opacity 0.2s ease, transform 0.2s ease', marginBottom: '12px', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Processing…' : 'Place Order →'}
          </button>

          <Link to="/" style={{ display: 'block', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>
            ← Continue Shopping
          </Link>

          <div id="chkStatusMsg" style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '15px', fontWeight: 500, color: statusColor }}>
            {statusMsg}
          </div>
        </section>
      </main>
    </>
  );
}
