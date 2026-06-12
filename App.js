// ==========================================
// 1. SUPABASE CONFIGURATION & INITIALIZATION
// ==========================================
const SUPABASE_URL = "https://qwcpiltbfbnfikqlhrrg.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Y3BpbHRiZmJuZmlrcWxocnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzY4ODIsImV4cCI6MjA5NDk1Mjg4Mn0.yHTBkF-rQaE-BK0RTcrVmmegqH3y-hgstBqr4P6LW1o"; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. STATE AND UI TARGET VARIABLES
// ==========================================
let liveProducts = []; 
let currentCategoryFilter = 'all'; 
let globalCart = JSON.parse(localStorage.getItem('swiftShopCart')) || [];
let runningCartTotal = 0; 

// DOM Layout Element Targets
const productsGrid = document.getElementById('productsGrid');
const cartCountDisplay = document.getElementById('cartCount');
const cartModalOverlay = document.getElementById('cartModalOverlay');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotalPrice = document.getElementById('cartTotalPrice');


// Checkout Loop Layout Panels
const cartItemsView = document.getElementById('cartItemsView');
const checkoutFormView = document.getElementById('checkoutFormView');
const cartActionButtons = document.getElementById('cartActionButtons');
const checkoutActionButtons = document.getElementById('checkoutActionButtons');
const drawerTitle = document.getElementById('drawerTitle');
const orderStatusMessage = document.getElementById('orderStatusMessage');
const submitOrderBtn = document.getElementById('submitOrderBtn');
const cartCheckoutSection = document.getElementById('cartCheckoutSection');

// ==========================================
// 3. DATABASE OPERATION: FETCH PRODUCTS
// ==========================================
async function fetchProductsFromDatabase() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        liveProducts = data;
        renderInventory();
        initializeHeroCarousel(); // <--- ADD THIS LINE HERE

    } catch (err) {
        console.error("Error communicating with database:", err.message);
        if (productsGrid) {
            productsGrid.innerHTML = `<p style="color: red; padding: 20px;">Failed to load products.</p>`;
        }
    }
}


// ==========================================
// 4. PRESENTATION: DRAW FILTERED STOREFRONT
// ==========================================
function renderInventory() {
    if (!productsGrid) return;
    productsGrid.innerHTML = ''; 
    
    // Smart filtering that checks both standard item categories and explicit entity collections
    const filteredItems = currentCategoryFilter === 'all' 
        ? liveProducts 
        : liveProducts.filter(item => {
            return item.category === currentCategoryFilter || 
                   item.collection === currentCategoryFilter || // Assumes a 'collection' column in Supabase
                   (item.brand && item.brand === currentCategoryFilter);
          });

    if (filteredItems.length === 0) {
        productsGrid.innerHTML = '<p style="padding: 20px; color: var(--text-muted);">No products found matching this selector.</p>';
        return;
    }

    // ... rest of your original loop logic remains exactly the same ...
    const productCardTemplate = document.getElementById('productCardTemplate');
    filteredItems.forEach(item => {
        // (Keep all your existing cardClone, image placeholders, and event assignment logic here)
        const displayImageHTML = item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : '<span style="font-size: 3rem; color: #ccc;">👜</span>';
        const cardClone = productCardTemplate.content.cloneNode(true);
        const cardRootNode = cardClone.querySelector('.product-card');
        const imageFrameNode = cardClone.querySelector('.image-placeholder');
        const titleNode = cardClone.querySelector('.product-card-title');
        const descNode = cardClone.querySelector('.product-card-desc'); // <-- ADD THIS
        const priceNode = cardClone.querySelector('.product-card-price');
        const cartButtonNode = cardClone.querySelector('.icon-cart-btn');

        if (cardRootNode) {
            cardRootNode.setAttribute('onclick', `window.location.href = 'ProductDetails.html?id=${item.id}'`);
        }
        if (imageFrameNode) imageFrameNode.innerHTML = displayImageHTML;
        
        if (titleNode) titleNode.innerText = item.name;
        
        // <-- ADD THIS LINE to inject the description (with a fallback if empty)
        if (descNode) descNode.innerText = item.description || 'Exclusive Atelier collection piece.';
        
        if (priceNode) priceNode.innerText = `KES ${Number(item.price).toLocaleString()}`;
        if (cartButtonNode) cartButtonNode.setAttribute('onclick', `event.stopPropagation(); handleAddToCart(${item.id});`);

        productsGrid.appendChild(cardClone);
    });
}

function filterStorefront(categoryName, clickedButton) {
    currentCategoryFilter = categoryName;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    clickedButton.classList.add('active');

    renderInventory(); 
}

// ==========================================
// 5. SHOPPING CART CORE QUANTITY CONTROLLERS
// ==========================================
function handleAddToCart(productId) {
    const productMatch = liveProducts.find(p => p.id === productId);
    
    if (productMatch) {
        const existingItem = globalCart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            const cartPayload = { ...productMatch, quantity: 1 };
            globalCart.push(cartPayload);
        }
        
        saveCartToVault();
    }
}

function handleUpdateQuantity(index, mutationValue) {
    const targetItem = globalCart[index];
    if (!targetItem) return;

    targetItem.quantity = (targetItem.quantity || 1) + mutationValue;

    if (targetItem.quantity < 1) {
        globalCart.splice(index, 1);
    }

    saveCartToVault();
}

function saveCartToVault() {
    localStorage.setItem('swiftShopCart', JSON.stringify(globalCart));
    updateCartBadge();
    renderCartContents(); // Keeps state perfectly synchronized
}

function updateCartBadge() {
    let totalItems = 0;
    let computedTotalSum = 0;

    globalCart.forEach(item => {
        const qty = item.quantity || 1;
        totalItems += qty;
        computedTotalSum += (Number(item.price) * qty);
    });

    if (cartCountDisplay) {
        cartCountDisplay.innerText = totalItems;
    }

    const headerPriceDisplay = document.getElementById('cartHeaderPrice');
    if (headerPriceDisplay) {
        headerPriceDisplay.innerText = `KES ${computedTotalSum.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
    }
}

// 6. CART REDIRECT & PAGE RENDERING

function toggleCartDrawer(shouldOpen) {
    if (shouldOpen) {
        // Redirect to the new dedicated cart page!
        window.location.href = 'Cart.html';
    }
}

function showCheckoutForm(isCheckout) {
    if (isCheckout) {
        if (globalCart.length === 0) return alert("Your cart is empty!");
        cartItemsView.style.display = 'none';
        cartActionButtons.style.display = 'none';
        
        checkoutFormView.style.display = 'block';
        checkoutActionButtons.style.display = 'block';
        drawerTitle.innerText = "Delivery Details";
    } else {
        cartItemsView.style.display = 'block';
        cartActionButtons.style.display = 'block';
        
        checkoutFormView.style.display = 'none';
        checkoutActionButtons.style.display = 'none';
        drawerTitle.innerText = "Your Shopping Bag";
        if (orderStatusMessage) orderStatusMessage.innerText = "";
    }
}

// ==========================================
// 7. RENDER CART CONTENTS VIA STENCIL NODES
// ==========================================
function renderCartContents() {
    if (!cartItemsList || !cartTotalPrice) return;
    
    cartItemsList.innerHTML = ''; 
    runningCartTotal = 0; 

    if (globalCart.length === 0) {
        cartItemsList.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px 20px; font-family: 'Poppins', sans-serif; width: 100%; box-sizing: border-box;">
                <h2 style="font-size: 1.6rem; font-weight: 400; color: #000000; margin-bottom: 25px; letter-spacing: 0.5px;">Your cart is empty</h2>
                <button onclick="toggleCartDrawer(false)" style="background: #111111; color: #ffffff; border: none; padding: 12px 30px; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: background 0.2s ease; font-family: 'Poppins', sans-serif;"
                        onmouseover="this.style.background='#333333'" 
                        onmouseout="this.style.background='#111111'">
                    Continue shopping
                </button>
            </div>
        `;
        
        cartTotalPrice.innerText = "KES 0";
        // HIDE THE ENTIRE BOTTOM SECTION
        if (cartCheckoutSection) cartCheckoutSection.style.display = 'none'; 
        return;
    }

    // SHOW THE ENTIRE BOTTOM SECTION IF CART HAS ITEMS
    if (cartCheckoutSection) cartCheckoutSection.style.display = 'block';

    const stencilTemplate = document.getElementById('cartItemTemplate');
    if (!stencilTemplate) return;

    globalCart.forEach((item, index) => {
        const itemQuantity = item.quantity || 1;
        const itemCombinedPrice = Number(item.price) * itemQuantity;
        runningCartTotal += itemCombinedPrice; 

        const rowClone = stencilTemplate.content.cloneNode(true);
        const nameNode = rowClone.querySelector('.cart-item-name');
        const qtyNode = rowClone.querySelector('.cart-item-quantity');
        const priceNode = rowClone.querySelector('.cart-item-price');
        const imageBoxNode = rowClone.querySelector('.cart-item-image-box');
        
        const plusBtnNode = rowClone.querySelector('.qty-plus-btn');
        const minusBtnNode = rowClone.querySelector('.qty-minus-btn');

        if (nameNode) nameNode.innerText = item.name;
        if (qtyNode) qtyNode.innerText = itemQuantity;
        if (priceNode) priceNode.innerText = `KES ${itemCombinedPrice.toLocaleString()}`;
        
        if (plusBtnNode) plusBtnNode.onclick = () => handleUpdateQuantity(index, 1);
        if (minusBtnNode) minusBtnNode.onclick = () => handleUpdateQuantity(index, -1);
        
        if (imageBoxNode && item.image_url) {
            imageBoxNode.innerHTML = `<img src="${item.image_url}" style="width:100%; height:100%; object-fit:cover;">`;
        }
        cartItemsList.appendChild(rowClone);
    });

    cartTotalPrice.innerText = `KES ${runningCartTotal.toLocaleString()}`;
}

function handleClearCart() {
    globalCart = [];
    localStorage.removeItem('swiftShopCart');
    updateCartBadge();
    renderCartContents();
}

// ==========================================
// 8. LUXURY QUICK VIEW MODAL CONTROLLER ENGINE
// ==========================================
function openProductModal(itemId) {
    const product = liveProducts.find(p => p.id === itemId);
    if (!product) return;

    const modal       = document.getElementById('productDetailModal');
    const mainImage   = document.getElementById('pdmMainImage');
    const brandTitle  = document.getElementById('pdmBrand');
    const prodName    = document.getElementById('pdmName');
    const priceLabel  = document.getElementById('pdmPrice');
    const addBtn      = document.getElementById('pdmAddBtn');
    const descBlock   = document.getElementById('pdmDesc');
    
    const thumbs      = document.querySelectorAll('.pdm-thumb');

    if (!modal) return;

    if (mainImage) mainImage.src = product.image_url || '';
    if (brandTitle) brandTitle.innerText = product.category || 'Handbags';
    if (prodName)   prodName.innerText   = product.name;
    if (priceLabel) priceLabel.innerText = `${Number(product.price).toLocaleString()} ksh`;
    if (descBlock)  descBlock.innerText  = product.description || `Classy all time item with elegant structures. Handpicked styling configurations crafted from premium selections.`;

    if (thumbs && thumbs.length >= 3) {
        if (product.image_url) {
            thumbs[0].src = product.image_url;
            thumbs[0].style.display = 'block';
        } else {
            thumbs[0].style.display = 'none';
        }

        if (product.image_url_2) {
            thumbs[1].src = product.image_url_2;
            thumbs[1].style.display = 'block';
        } else {
            thumbs[1].style.display = 'none';
        }

        if (product.image_url_3) {
            thumbs[2].src = product.image_url_3;
            thumbs[2].style.display = 'block';
        } else {
            thumbs[2].style.display = 'none';
        }
    }

    if (addBtn) {
        addBtn.setAttribute('onclick', `handleAddToCart(${product.id}); document.getElementById('productDetailModal').style.display='none';`);
    }

    modal.style.display = 'flex';
}

function swapPdmView(srcPath) {
    const mainImage = document.getElementById('pdmMainImage');
    if (mainImage) mainImage.src = srcPath;
}

function closeProductModal(event) {
    const modal = document.getElementById('productDetailModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// ==========================================
// 9. DATABASE OPERATION: PLACE NEW ORDERS
// ==========================================
if (submitOrderBtn) {
    submitOrderBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('custName').value;
        const phoneInput = document.getElementById('custPhone').value;
        const locationInput = document.getElementById('custLocation').value;

        if (!nameInput || !phoneInput || !locationInput) {
            return alert("Please fill out all delivery fields.");
        }

        if (orderStatusMessage) {
            orderStatusMessage.innerText = "Processing order...";
            orderStatusMessage.style.color = "var(--text-muted)";
        }

        try {
            const { error } = await supabaseClient
                .from('orders')
                .insert([
                    {
                        customer_name: nameInput,
                        phone_number: phoneInput,
                        delivery_location: locationInput,
                        cart_items: globalCart, 
                        total_price: runningCartTotal
                    }
                ]);

            if (error) throw error;

            if (orderStatusMessage) {
                orderStatusMessage.innerText = "Order placed successfully!";
                orderStatusMessage.style.color = "green";
            }

            setTimeout(() => {
                handleClearCart();
                toggleCartDrawer(false);
                document.getElementById('deliveryForm').reset();
            }, 2000);

        } catch (err) {
            console.error("Order process failure:", err.message);
            if (orderStatusMessage) {
                orderStatusMessage.innerText = " Order Failed: " + err.message;
                orderStatusMessage.style.color = "red";
            }
        }
    });
}

function toggleSearchField() {
    const searchInput = document.getElementById('storefrontSearchInput');
    if (!searchInput) return;
    
    if (searchInput.style.display === 'none') {
        searchInput.style.display = 'block';
        searchInput.focus();
    } else {
        searchInput.style.display = 'none';
        searchInput.value = '';
        renderInventory(); 
    }
}

function handleSearchFilter(queryText) {
    const cleanQuery = queryText.toLowerCase().trim();
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    const filteredItems = liveProducts.filter(item => {
        const matchesCategory = currentCategoryFilter === 'all' || item.category === currentCategoryFilter;
        const matchesSearch = item.name.toLowerCase().includes(cleanQuery) || 
                              (item.category && item.category.toLowerCase().includes(cleanQuery));
        return matchesCategory && matchesSearch;
    });

    if (filteredItems.length === 0) {
        productsGrid.innerHTML = '<p style="padding: 20px; color: var(--text-muted);">No products match your search query.</p>';
        return;
    }

    const productCardTemplate = document.getElementById('productCardTemplate');
    
    filteredItems.forEach(item => {
        const displayImageHTML = item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : '<span>👜</span>';
        const cardClone = productCardTemplate.content.cloneNode(true);
        const cardRootNode = cardClone.querySelector('.product-card');
        const imageFrameNode = cardClone.querySelector('.image-placeholder');
        
        if (cardRootNode) cardRootNode.setAttribute('onclick', `openProductModal(${item.id})`);
        if (imageFrameNode) {
            imageFrameNode.innerHTML = displayImageHTML;
            if (item.image_url_2) {
                imageFrameNode.setAttribute('onmouseenter', `const img = this.querySelector('img'); if(img) img.src = '${item.image_url_2}';`);
                imageFrameNode.setAttribute('onmouseleave', `const img = this.querySelector('img'); if(img) img.src = '${item.image_url || ''}';`);
            }
        }
        
        cardClone.querySelector('.product-card-title').innerText = item.name;
        cardClone.querySelector('.product-card-price').innerText = `KES ${Number(item.price).toLocaleString()}`;
        cardClone.querySelector('.icon-cart-btn').setAttribute('onclick', `event.stopPropagation(); handleAddToCart(${item.id});`);
        
        productsGrid.appendChild(cardClone);
    });
}

function toggleCategoryMenu(shouldOpen) {
    const menuOverlay = document.getElementById('categoryMenuOverlay');
    if (!menuOverlay) return;
    menuOverlay.style.display = shouldOpen ? 'block' : 'none';
}

function filterStorefrontViaDrawer(categoryName, clickedBtn) {
    currentCategoryFilter = categoryName;

    document.querySelectorAll('.drawer-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    clickedBtn.classList.add('active');

    renderInventory(); 
    toggleCategoryMenu(false); 
}

function renderCheckoutSummaryPage() {
    const listContainer = document.getElementById('checkoutSummaryList');
    const subtotalLabel = document.getElementById('chkSubtotal');
    const totalLabel    = document.getElementById('chkTotal');

    if (!listContainer) return; 
    listContainer.innerHTML = '';
    
    let subtotalCalculator = 0;

    if (globalCart.length === 0) {
        listContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 20px 0;">Your checkout session is empty.</p>';
        return;
    }

    globalCart.forEach(item => {
        const qty = item.quantity || 1;
        const lineCost = Number(item.price) * qty;
        subtotalCalculator += lineCost;

        const summaryRow = document.createElement('div');
        summaryRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; border-bottom: 1px solid #f9fafb; padding-bottom: 8px;";
        summaryRow.innerHTML = `
            <div style="display: flex; gap: 12px; align-items: center;">
                <div style="width: 50px; height: 50px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="${item.image_url || ''}" style="width: 100%; height: 100%; object-fit: contain; padding: 4px;">
                </div>
                <div>
                    <div style="font-weight: 600; color: #000;">${item.name}</div>
                    <div style="font-size: 0.8rem; color: #666;">Qty: ${qty}</div>
                </div>
            </div>
            <div style="font-weight: 500; color: #000;">KES ${lineCost.toLocaleString()}</div>
        `;
        listContainer.appendChild(summaryRow);
    });

    runningCartTotal = subtotalCalculator;
    if (subtotalLabel) subtotalLabel.innerText = `KES ${runningCartTotal.toLocaleString()}`;
    if (totalLabel)    totalLabel.innerText    = `KES ${runningCartTotal.toLocaleString()}`;
}

// ==========================================
// 9. SECURE CHECKOUT & ORDER PROCESSING
// ==========================================
// ==========================================
// 9. SECURE CHECKOUT & ORDER PROCESSING
// ==========================================
async function processCheckoutOrder() {
    const firstName = document.getElementById('chkFirstName').value;
    const lastName  = document.getElementById('chkLastName').value;
    const location  = document.getElementById('chkLocation').value;
    const phone     = document.getElementById('chkPhone').value;
    const statusMsg = document.getElementById('chkStatusMsg');
    const actionBtn = document.getElementById('chkPlaceOrderBtn');

    if (!firstName || !lastName || !location || !phone) {
        return alert("Please fill out all required shipping fields to secure your order.");
    }

    const isMpesa = document.getElementById('payMpesa') && document.getElementById('payMpesa').checked;
    const isCard = document.getElementById('payCard') && document.getElementById('payCard').checked;
    const chosenMethod = isMpesa ? 'M-Pesa' : (isCard ? 'Card' : 'PayPal');

    if (statusMsg) {
        statusMsg.innerText = "Processing order details securely...";
        statusMsg.style.color = "#666666";
    }
    if (actionBtn) actionBtn.disabled = true;

    try {
        const orderId = 'ORD-' + Math.floor(Math.random() * 1000000);

        
        // ROUTE A: M-PESA STK PUSH
        
        if (isMpesa) {
            if (statusMsg) {
                statusMsg.innerText = "Initiating M-Pesa STK Push... Please check your phone.";
                statusMsg.style.color = "#040404";
            }

            const { data: pushData, error: pushError } = await supabaseClient.functions.invoke('mpesa_stk_push', {
                body: { phoneNumber: phone, totalAmount: runningCartTotal, orderId: orderId }
            });

            if (pushError) throw pushError;

            // Log pending order to Supabase
            await logOrderToDatabase('Pending', orderId, chosenMethod, firstName, lastName, phone, location);
            triggerWhatsAppRedirect(firstName, lastName, phone, location, chosenMethod);
        } 
        
        // ROUTE B: PAYSTACK CREDIT CARD 
      
        else if (isCard) {
            if (statusMsg) {
                statusMsg.innerText = "Opening secure payment gateway...";
                statusMsg.style.color = "#000000";
            }

            // Paystack requires an email. We generate a placeholder using their phone.
            const customerEmail = `${phone.replace(/\+/g, '')}@rueandkay.com`;

            let handler = PaystackPop.setup({
                key: 'sk_test_6fd66dc4b3af626cdf7ee7e3dc4606a69167f064', 
                email: customerEmail,
                amount: runningCartTotal * 100, // Paystack uses cents/kobo
                currency: 'KES',
                ref: orderId,
                onClose: function() {
                    if (statusMsg) {
                        statusMsg.innerText = "Payment window closed. Transaction cancelled.";
                        statusMsg.style.color = "#dc2626";
                    }
                    if (actionBtn) actionBtn.disabled = false;
                },
                // PAYSTACK FIX: Standard function on the outside, async on the inside!
                callback: function(response) {
                    (async function() {
                        if (statusMsg) {
                            statusMsg.innerText = "Payment Successful! Securing your order...";
                            statusMsg.style.color = "#0f100f";
                        }
                        
                        // Log Paid order to Supabase
                        await logOrderToDatabase('Paid', response.reference, chosenMethod, firstName, lastName, phone, location);
                        triggerWhatsAppRedirect(firstName, lastName, phone, location, chosenMethod);
                    })();
                }
            });

            

            handler.openIframe();
        }

    } catch (err) {
        console.error("Checkout breakdown:", err.message);
        if (statusMsg) {
            statusMsg.innerText = " Transaction failed: " + err.message;
            statusMsg.style.color = "#dc2626";
        }
        if (actionBtn) actionBtn.disabled = false;
    }
}

// Helper Function: Keeps code clean by handling the database save
async function logOrderToDatabase(status, receiptRef, method, fName, lName, phone, loc) {
    const { error } = await supabaseClient.from('orders').insert([{
        customer_name: `${fName} ${lName}`,
        phone_number: phone,
        delivery_location: loc,
        cart_items: globalCart, 
        total_price: runningCartTotal,
        payment_method: method,
        payment_status: status,
        mpesa_receipt: receiptRef 
    }]);
    if (error) throw error;
}

// Helper Function: Keeps code clean by handling the WhatsApp redirect
function triggerWhatsAppRedirect(fName, lName, phone, loc, method) {
    let itemsOrderedText = "";
    globalCart.forEach((item, index) => {
        itemsOrderedText += `${index + 1}. ${item.name} (Qty: ${item.quantity || 1})\n`;
    });

    const rawMessage = `Hello *Rue and Kay Atelier*,\n\n🛍️ *NEW ORDER PLACED!*\n---------------------------\n👤 *Customer:* ${fName} ${lName}\n📞 *Contact:* ${phone}\n📍 *Delivery Location:* ${loc}\n💳 *Payment Method:* ${method}\n\n📦 *Items Requested:*\n${itemsOrderedText}\n💰 *Total Amount:* KES ${runningCartTotal.toLocaleString()}\n---------------------------\n🚚 *Estimated Delivery:* 24 to 48 hours.`;

    const encodedTextString = encodeURIComponent(rawMessage);
    const globalWhatsAppLink  = `https://wa.me/254748184217?text=${encodedTextString}`;

    globalCart = [];
    localStorage.removeItem('swiftShopCart');

    setTimeout(() => { window.location.href = globalWhatsAppLink; }, 2000);
}
// Toggle conditional payment fields panel display state
function togglePaymentFields(selectedMethod) {
    const mpesaForm = document.getElementById('mpesaDetailsSubForm');
    const cardForm  = document.getElementById('cardDetailsSubForm');
    const gatewayForm = document.getElementById('globalGatewaySubForm');
    const nativePlaceOrderBtn = document.getElementById('chkPlaceOrderBtn');

    // Safety check
    if (!mpesaForm || !gatewayForm) return;

    if (selectedMethod === 'mpesa') {
        mpesaForm.style.display = 'block';
        if (cardForm) cardForm.style.display = 'none';
        gatewayForm.style.display = 'none';
        
        // Show native black button
        if (nativePlaceOrderBtn) nativePlaceOrderBtn.style.display = 'block'; 
        
    } else if (selectedMethod === 'card') {
        mpesaForm.style.display = 'none';
        if (cardForm) cardForm.style.display = 'flex'; // Uses flex for your layout grid
        gatewayForm.style.display = 'none';
        
        // Show native black button so they can submit your custom card form
        if (nativePlaceOrderBtn) nativePlaceOrderBtn.style.display = 'block'; 
        
    } else if (selectedMethod === 'paypal') {
        mpesaForm.style.display = 'none';
        if (cardForm) cardForm.style.display = 'none';
        gatewayForm.style.display = 'block';
        
        // HIDE native black button because PayPal SDK buttons handle the click
        if (nativePlaceOrderBtn) nativePlaceOrderBtn.style.display = 'none'; 
        
        // Initialize PayPal smart buttons
        initializeGlobalGatewayPortal();
    }
}

function revealContactCards() {
    const defaultLinks = document.getElementById('footerDefaultLinks');
    const contactPanels = document.getElementById('footerContactPanels');
    
    if (defaultLinks && contactPanels) {
        defaultLinks.style.display = 'none';
        contactPanels.style.display = 'block';
    }
}

function hideContactCards() {
    const defaultLinks = document.getElementById('footerDefaultLinks');
    const contactPanels = document.getElementById('footerContactPanels');
    
    if (defaultLinks && contactPanels) {
        contactPanels.style.display = 'none';
        defaultLinks.style.display = 'block';
    }
}





// FULL PAGE CART RENDERER (For Cart.html)

function renderFullPageCart() {
    const emptyView = document.getElementById('emptyCartView');
    const filledView = document.getElementById('filledCartView');
    const itemsGrid = document.getElementById('cartPageItemsGrid');
    const subtotalText = document.getElementById('pageSubtotalValue');
    const grandTotalText = document.getElementById('pageGrandTotalValue');
    const template = document.getElementById('cartPageItemTemplate');

    // Only run if we are actually on Cart.html
    if (!emptyView || !filledView || !itemsGrid || !template) return; 

    // --- EMPTY STATE ---
    if (globalCart.length === 0) {
        emptyView.style.display = 'block';
        filledView.style.display = 'none';
        return;
    }

    // --- FILLED STATE ---
    emptyView.style.display = 'none';
    filledView.style.display = 'block';
    
    let runningTotal = 0;
    itemsGrid.innerHTML = ''; // Clear old rows

    globalCart.forEach((item, index) => {
        const qty = item.quantity || 1;
        const subtotal = Number(item.price) * qty;
        runningTotal += subtotal;

        // 1. Clone the HTML from Cart.html
        const clone = template.content.cloneNode(true);

        // 2. Fill in the data
        const imgNode = clone.querySelector('.cp-image');
        if (imgNode && item.image_url) imgNode.src = item.image_url;
        
        clone.querySelector('.cp-name').innerText = item.name;
        clone.querySelector('.cp-id').innerText = `Item No.: RK-${item.id}`;
        clone.querySelector('.cp-price').innerText = `KES ${Number(item.price).toLocaleString()}`;
        clone.querySelector('.cp-qty').innerText = qty;
        clone.querySelector('.cp-subtotal').innerText = `KES ${subtotal.toLocaleString()}`;

        // 3. Attach the button functions
        clone.querySelector('.cp-minus-btn').onclick = () => handleUpdateQuantityOnPage(index, -1);
        clone.querySelector('.cp-plus-btn').onclick = () => handleUpdateQuantityOnPage(index, 1);
        clone.querySelector('.cp-remove-btn').onclick = () => handleRemoveItem(index);

        // 4. Inject it into the page
        itemsGrid.appendChild(clone);
    });

    // Update Totals directly in the HTML
    subtotalText.innerText = `KES ${runningTotal.toLocaleString()}`;
    grandTotalText.innerText = `KES ${runningTotal.toLocaleString()}`;
}

// Helpers for the full page cart
function handleUpdateQuantityOnPage(index, mutationValue) {
    handleUpdateQuantity(index, mutationValue);
    renderFullPageCart(); 
}

function handleRemoveItem(index) {
    globalCart.splice(index, 1);
    saveCartToVault();
    renderFullPageCart(); 
}

// Auto-run when the page loads
document.addEventListener('DOMContentLoaded', () => {
    renderFullPageCart();
});

// Helpers for the full page cart
function handleUpdateQuantityOnPage(index, mutationValue) {
    handleUpdateQuantity(index, mutationValue);
    renderFullPageCart(); 
}

function handleRemoveItem(index) {
    globalCart.splice(index, 1);
    saveCartToVault();
    renderFullPageCart(); 
}

// Auto-run when the page loads
document.addEventListener('DOMContentLoaded', () => {
    renderFullPageCart();
});


// HERO CAROUSEL ANIMATION ENGINE

let heroImageIndex = 0;
let heroCarouselInterval;

function initializeHeroCarousel() {
    const heroImgElement = document.getElementById('heroDynamicImage');
    if (!heroImgElement) return;

    // Extract all valid image URLs from your live Supabase products
    const validImages = liveProducts.map(item => item.image_url).filter(url => url);
    
    // Safety fallback just in case the database is empty
    if (validImages.length === 0) return;

    // Set the first image immediately
    heroImgElement.src = validImages[0];

    // Clear any existing loops to prevent glitching
    if (heroCarouselInterval) clearInterval(heroCarouselInterval);

    // Start the 3-second cycle loop
    heroCarouselInterval = setInterval(() => {
        // 1. Fade the current image out
        heroImgElement.style.opacity = '0';
        
        setTimeout(() => {
            // 2. Swap the source link while it is invisible
            heroImageIndex = (heroImageIndex + 1) % validImages.length;
            heroImgElement.src = validImages[heroImageIndex];
            
            // 3. Fade the new image back in
            heroImgElement.style.opacity = '1';
        }, 600); // 600ms matches the CSS transition timer
        
    }, 3000); // Triggers every 3 seconds
}

// ==========================================
// 10. COLD-BOOT APPLICATION INITIALIZATION
// ==========================================
fetchProductsFromDatabase();
updateCartBadge();
renderCartContents(); // FIX: Added initialization render call explicitly on cold boot