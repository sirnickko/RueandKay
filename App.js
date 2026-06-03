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
        const priceNode = cardClone.querySelector('.product-card-price');
        const cartButtonNode = cardClone.querySelector('.icon-cart-btn');

        if (cardRootNode) cardRootNode.setAttribute('onclick', `openProductModal(${item.id})`);
        if (imageFrameNode) imageFrameNode.innerHTML = displayImageHTML;
        if (titleNode) titleNode.innerText = item.name;
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

// ==========================================
// 6. POPUP PANEL VISIBILITY LAYOUT TOGGLES
// ==========================================
function toggleCartDrawer(shouldOpen) {
    if (!cartModalOverlay) return;
    if (shouldOpen) {
        cartModalOverlay.style.display = 'flex';
        showCheckoutForm(false); 
        renderCartContents(); 
        
        cartModalOverlay.onclick = function(event) {
            if (event.target === cartModalOverlay) toggleCartDrawer(false);
        };
    } else {
        cartModalOverlay.style.display = 'none';
        cartModalOverlay.onclick = null;
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
        if (cartActionButtons) cartActionButtons.style.display = 'none';
        return;
    }

    if (cartActionButtons) cartActionButtons.style.display = 'block';

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

    if (statusMsg) {
        statusMsg.innerText = "Processing order details securely...";
        statusMsg.style.color = "#666666";
    }
    if (actionBtn) actionBtn.disabled = true;

    try {
        const chosenMethod = document.getElementById('payCard').checked ? 'Card' : (document.getElementById('payPaypal').checked ? 'PayPal' : 'M-Pesa');

        const { error } = await supabaseClient
            .from('orders')
            .insert([
                {
                    customer_name: `${firstName} ${lastName}`,
                    phone_number: phone,
                    delivery_location: location,
                    cart_items: globalCart, 
                    total_price: runningCartTotal,
                    payment_method: chosenMethod
                }
            ]);

        if (error) throw error;

        const shopWhatsAppNumber = "254748184217"; 
        
        let itemsOrderedText = "";
        globalCart.forEach((item, index) => {
            itemsOrderedText += `${index + 1}. ${item.name} (Qty: ${item.quantity || 1})\n`;
        });

        const rawMessage = `Hello *Rue and Kay Atelier*,\n\n` +
                           `🛍️ *NEW ORDER PLACED!*\n` +
                           `---------------------------\n` +
                           `👤 *Customer:* ${firstName} ${lastName}\n` +
                           `📞 *Contact:* ${phone}\n` +
                           `📍 *Delivery Location:* ${location}, ${document.getElementById('chkCity').value}\n` +
                           `💳 *Payment Method:* ${chosenMethod}\n\n` +
                           `📦 *Items Requested:*\n${itemsOrderedText}\n` +
                           `💰 *Total Amount:* KES ${runningCartTotal.toLocaleString()}\n` +
                           `---------------------------\n` +
                           `🚚 *Estimated Delivery:* Your luxury package will be processed and delivered within *24 to 48 hours*. Thank you for shopping with us!`;

        const encodedTextString = encodeURIComponent(rawMessage);
        const globalWhatsAppLink  = `https://wa.me/${shopWhatsAppNumber}?text=${encodedTextString}`;

        if (statusMsg) {
            statusMsg.innerText = "Order secured! Redirecting to WhatsApp for instant confirmation...";
            statusMsg.style.color = "#059669";
        }

        globalCart = [];
        localStorage.removeItem('swiftShopCart');

        setTimeout(() => {
            window.location.href = globalWhatsAppLink;
        }, 2000);

    } catch (err) {
        console.error("Checkout process breakdown:", err.message);
        if (statusMsg) {
            statusMsg.innerText = " Transaction processing failed: " + err.message;
            statusMsg.style.color = "#dc2626";
        }
        if (actionBtn) actionBtn.disabled = false;
    }
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

// ==========================================
// 10. COLD-BOOT APPLICATION INITIALIZATION
// ==========================================
fetchProductsFromDatabase();
updateCartBadge();
renderCartContents(); // FIX: Added initialization render call explicitly on cold boot