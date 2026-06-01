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
let currentCategoryFilter = 'all'; // Tracks currently selected store category filter
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
    
    const filteredItems = currentCategoryFilter === 'all' 
        ? liveProducts 
        : liveProducts.filter(item => item.category === currentCategoryFilter);

    if (filteredItems.length === 0) {
        productsGrid.innerHTML = '<p style="padding: 20px; color: var(--text-muted);">No products found in this category.</p>';
        return;
    }

    // Capture our native HTML blueprint element container
    const productCardTemplate = document.getElementById('productCardTemplate');

    filteredItems.forEach(item => {
        // Fallback default placeholder icon if image url entry link is empty
        const displayImageHTML = item.image_url 
            ? `<img src="${item.image_url}" alt="${item.name}">` 
            : '<span style="font-size: 3rem; color: #ccc;">👜</span>';

        // 1. Clone a fresh, empty layout instance of your HTML template card architecture
        const cardClone = productCardTemplate.content.cloneNode(true);

        // 2. Locate target selector nodes inside our cloned structure blueprint copy
        const cardRootNode    = cardClone.querySelector('.product-card');
        const imageFrameNode  = cardClone.querySelector('.image-placeholder');
        const titleNode       = cardClone.querySelector('.product-card-title');
        const priceNode       = cardClone.querySelector('.product-card-price');
        const cartButtonNode  = cardClone.querySelector('.icon-cart-btn');

        // 3. Map values and event listeners directly into elements
        if (cardRootNode) {
            cardRootNode.setAttribute('onclick', `openProductModal(${item.id})`);
        }
        if (imageFrameNode && item.image_url_2) {
            imageFrameNode.setAttribute('onmouseenter', `const img = this.querySelector('img'); if(img) img.src = '${item.image_url_2}';`);
            imageFrameNode.setAttribute('onmouseleave', `const img = this.querySelector('img'); if(img) img.src = '${item.image_url || ''}';`);
        }
        if (imageFrameNode) {
            imageFrameNode.innerHTML = displayImageHTML;
        }
        if (titleNode)      titleNode.innerText = item.name;
        if (priceNode)      priceNode.innerText = `KES ${Number(item.price).toLocaleString()}`;
        
        if (cartButtonNode) {
            // event.stopPropagation() stops the click from bubbling up and forcing the modal open accidentally
            cartButtonNode.setAttribute('onclick', `event.stopPropagation(); handleAddToCart(${item.id});`);
        }

        // 4. Inject the completed card right onto your storefront screen grid row layer
        productsGrid.appendChild(cardClone);
    });
}

// Action Controller: Swaps category filtering selection state values
function filterStorefront(categoryName, clickedButton) {
    currentCategoryFilter = categoryName;
    
    // Style adjustments: toggle button background focus visual states via CSS clean classing
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    clickedButton.classList.add('active');

    renderInventory(); // Redraw grid cards live
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
            // Use spread operator to prevent altering master table item states accidentally
            const cartPayload = { ...productMatch, quantity: 1 };
            globalCart.push(cartPayload);
        }
        
        saveCartToVault();
    }
}

// Core operational modifier controlling incrementing/decrementing math items
function handleUpdateQuantity(index, mutationValue) {
    const targetItem = globalCart[index];
    if (!targetItem) return;

    targetItem.quantity = (targetItem.quantity || 1) + mutationValue;

    // Boundary rule: If quantity gets manually drained lower than 1, delete the product row entirely
    if (targetItem.quantity < 1) {
        globalCart.splice(index, 1);
    }

    saveCartToVault();
    renderCartContents(); // Redraw rows instantly inside the open overlay layout
}

function saveCartToVault() {
    localStorage.setItem('swiftShopCart', JSON.stringify(globalCart));
    updateCartBadge();
}

function updateCartBadge() {
    if (cartCountDisplay) {
        const totalItems = globalCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCountDisplay.innerText = totalItems;
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
        cartItemsList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 30px 0;">Your shopping cart is currently empty.</p>';
        cartTotalPrice.innerText = "KES 0";
        return;
    }

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
        
        // Target our adjustment triggers
        const plusBtnNode = rowClone.querySelector('.qty-plus-btn');
        const minusBtnNode = rowClone.querySelector('.qty-minus-btn');

        if (nameNode) nameNode.innerText = item.name;
        if (qtyNode) qtyNode.innerText = itemQuantity; // Sets visible core count digit
        if (priceNode) priceNode.innerText = `KES ${itemCombinedPrice.toLocaleString()}`;
        
        // Connect dynamic functional assignment nodes to adjustments math triggers
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

    // Grab your unique Canva modal view element nodes
    const modal       = document.getElementById('productDetailModal');
    const mainImage   = document.getElementById('pdmMainImage');
    const brandTitle  = document.getElementById('pdmBrand');
    const prodName    = document.getElementById('pdmName');
    const priceLabel  = document.getElementById('pdmPrice');
    const addBtn      = document.getElementById('pdmAddBtn');
    const descBlock   = document.getElementById('pdmDesc');
    
    // Grab all 3 thumbnail image elements inside your row array
    const thumbs      = document.querySelectorAll('.pdm-thumb');

    if (!modal) return;

    // Direct data variables map binding strings
    if (mainImage) mainImage.src = product.image_url || '';
    
    if (brandTitle) brandTitle.innerText = product.category || 'Handbags';
    if (prodName)   prodName.innerText   = product.name;
    if (priceLabel) priceLabel.innerText = `${Number(product.price).toLocaleString()} ksh`;
    if (descBlock)  descBlock.innerText  = product.description || `Classy all time item with elegant structures. Handpicked styling configurations crafted from premium selections.`;

    // DYNAMIC THUMBNAILS MAPPING LOGIC (FIXED)
    // Checks your Supabase data payload keys and safely handles image assets
    if (thumbs && thumbs.length >= 3) {
        
        // Thumbnail 1: Primary Image
        if (product.image_url) {
            thumbs[0].src = product.image_url;
            thumbs[0].style.display = 'block';
        } else {
            thumbs[0].style.display = 'none';
        }

        // Thumbnail 2: Second Angle View (Supabase column name MUST match: image_url_2)
        if (product.image_url_2) {
            thumbs[1].src = product.image_url_2;
            thumbs[1].style.display = 'block';
        } else {
            thumbs[1].style.display = 'none'; // Hides the box if it's empty in Supabase
        }

        // Thumbnail 3: Third Angle View (Supabase column name MUST match: image_url_3)
        if (product.image_url_3) {
            thumbs[2].src = product.image_url_3;
            thumbs[2].style.display = 'block';
        } else {
            thumbs[2].style.display = 'none'; // Hides the box if it's empty in Supabase
        }
    }

    // Connect checkout cart actions onto your black primary pill checkout trigger button
    if (addBtn) {
        addBtn.setAttribute('onclick', `handleAddToCart(${product.id}); document.getElementById('productDetailModal').style.display='none';`);
    }

    // Unhide modal display overlay container layout instantly
    modal.style.display = 'flex';
}
function swapPdmView(srcPath) {
    const mainImage = document.getElementById('pdmMainImage');
    if (mainImage) mainImage.src = srcPath;
}

function closeProductModal(event) {
    const modal = document.getElementById('productDetailModal');
    // Safety check ensuring backdrop selections close panels safely
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
// Toggle search input visibility layout state
function toggleSearchField() {
    const searchInput = document.getElementById('storefrontSearchInput');
    if (!searchInput) return;
    
    if (searchInput.style.display === 'none') {
        searchInput.style.display = 'block';
        searchInput.focus();
    } else {
        searchInput.style.display = 'none';
        searchInput.value = '';
        renderInventory(); // Reset grid if closed
    }
}

// Real-time lookup filtering engine matching database titles
function handleSearchFilter(queryText) {
    const cleanQuery = queryText.toLowerCase().trim();
    
    // Intercept normal renderInventory behavior with query limits
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    // Apply dual layer filtering (checks active category AND search text strings)
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
    
    // Re-run standard card cloning loop for matches
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
        
        cardClone.querySelector('.product-card-category').innerText = item.category || 'Handbags';
        cardClone.querySelector('.product-card-title').innerText = item.name;
        cardClone.querySelector('.product-card-price').innerText = `KES ${Number(item.price).toLocaleString()}`;
        cardClone.querySelector('.icon-cart-btn').setAttribute('onclick', `event.stopPropagation(); handleAddToCart(${item.id});`);
        
        productsGrid.appendChild(cardClone);
    });
}
// Toggle slide out category menu layout view states
function toggleCategoryMenu(shouldOpen) {
    const menuOverlay = document.getElementById('categoryMenuOverlay');
    if (!menuOverlay) return;
    menuOverlay.style.display = shouldOpen ? 'block' : 'none';
}

// Dedicated vertical filter driver utility
function filterStorefrontViaDrawer(categoryName, clickedBtn) {
    currentCategoryFilter = categoryName;

    // Reset visual selection cues across drawer buttons
    document.querySelectorAll('.drawer-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    clickedBtn.classList.add('active');

    renderInventory(); // Re-render grid cards live
    toggleCategoryMenu(false); // Smooth close panel after selection change
}
// ==========================================
// 11. CHECKOUT VIEW CONTROL GENERATOR LOGIC
// ==========================================
function renderCheckoutSummaryPage() {
    const listContainer = document.getElementById('checkoutSummaryList');
    const subtotalLabel = document.getElementById('chkSubtotal');
    const totalLabel    = document.getElementById('chkTotal');

    if (!listContainer) return; // Guard protection preventing errors if run on normal landing view
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

        // Render dynamic minimal text lines matching your Canva blueprint items list row
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

// Order handling function that binds database records across columns
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

        if (statusMsg) {
            statusMsg.innerText = "Order placed successfully! Redirecting...";
            statusMsg.style.color = "#059669";
        }

        // Clean cart metrics out of cache memory structures
        globalCart = [];
        localStorage.removeItem('swiftShopCart');

        // --- START OF WHATSAPP AUTOMATED MESSAGE GENERATOR ---
        const shopWhatsAppNumber = "254748184217"; // Replace this with your actual business phone number
        
        // Build an explicit structural list text string of what they bought
        let itemsOrderedText = "";
        globalCart.forEach((item, index) => {
            itemsOrderedText += `${index + 1}. ${item.name} (Qty: ${item.quantity || 1})\n`;
        });

        // Format a gorgeous, professional text delivery ticket invoice copy
        const rawMessage = `Hello *Rue and Kay Atelier*,\n\n` +
                           ` *NEW ORDER PLACED!*\n` +
                           `---------------------------\n` +
                           ` *Customer:* ${firstName} ${lastName}\n` +
                           `*Contact:* ${phone}\n` +
                           ` *Delivery Location:* ${location}, ${document.getElementById('chkCity').value}\n` +
                           ` *Payment Method:* ${chosenMethod}\n\n` +
                           ` *Items Requested:*\n${itemsOrderedText}\n` +
                           ` *Total Amount:* KES ${runningCartTotal.toLocaleString()}\n` +
                           `---------------------------\n` +
                           ` *Estimated Delivery:* Your luxury package will be processed and delivered within *24 to 48 hours*. Thank you for shopping with us!`;

        // Encode the text strings cleanly to protect format spaces over global URL protocols
        const encodedTextString = encodeURIComponent(rawMessage);
        const globalWhatsAppLink  = `https://wa.me/${shopWhatsAppNumber}?text=${encodedTextString}`;
        // --- END OF WHATSAPP AUTOMATED MESSAGE GENERATOR ---

        if (statusMsg) {
            statusMsg.innerText = "Order secured! Redirecting to WhatsApp for instant confirmation...";
            statusMsg.style.color = "#059669";
        }

        // Clean cart metrics out of cache memory structures
        globalCart = [];
        localStorage.removeItem('swiftShopCart');

        setTimeout(() => {
            // Instantly launches WhatsApp app or web tab with pre-typed confirmation template message
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
    const cardForm = document.getElementById('cardDetailsSubForm');
    if (!cardForm) return;
    
    // Only show sub-form inputs if user selects credit card option
    cardForm.style.display = (selectedMethod === 'card') ? 'flex' : 'none';
}
// Toggle display state to swap footer maps into contact cards
function revealContactCards() {
    const defaultLinks = document.getElementById('footerDefaultLinks');
    const contactPanels = document.getElementById('footerContactPanels');
    
    if (defaultLinks && contactPanels) {
        defaultLinks.style.display = 'none';
        contactPanels.style.display = 'block';
    }
}

// Revert back to original layout map state
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