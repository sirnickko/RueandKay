
//configuring superbase

const SUPABASE_URL = "https://qwcpiltbfbnfikqlhrrg.supabase.co"; // Replace with your URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Y3BpbHRiZmJuZmlrcWxocnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzY4ODIsImV4cCI6MjA5NDk1Mjg4Mn0.yHTBkF-rQaE-BK0RTcrVmmegqH3y-hgstBqr4P6LW1o"; // Replace with your Anon Key

// Initialize the global connection client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

//STATE AND UI TARGET VARIABLES

let liveProducts = []; 
let globalCart = [];

const productsGrid = document.getElementById('productsGrid');
const cartCountDisplay = document.getElementById('cartCount');


//  Controller fetches data from the cloud database and updates our local state variable, then triggers a re-render of the screen

async function fetchProductsFromDatabase() {
    try {
        // Query the 'products' table and pull all rows (*), ordered by id
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        // Sync our local array state variable with the live cloud database data
        liveProducts = data;
        
        // Render the freshly fetched data to the browser screen
        renderInventory();

    } catch (err) {
        console.error("Error communicating with database:", err.message);
        if (productsGrid) {
            productsGrid.innerHTML = `<p style="color: red; padding: 20px;">Failed to load products. Please check configuration.</p>`;
        }
    }
}

//  PRESENTATION: RENDER HTML CARDS

function renderInventory() {
    if (!productsGrid) return;
    productsGrid.innerHTML = ''; 
    
    if (liveProducts.length === 0) {
        productsGrid.innerHTML = '<p style="padding: 20px;">No products available in the shop database yet.</p>';
        return;
    }

    liveProducts.forEach(item => {
        // Use database values. Fallback to placeholder text if no image URL exists
        const displayImage = item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` : 'Product Image';

        const cardTemplate = `
            <div class="product-card">
                <div>
                    <div class="image-placeholder">${displayImage}</div>
                    <div class="product-info">
                        <h3>${item.name}</h3>
                        <p class="price">KES ${Number(item.price).toLocaleString()}</p>
                    </div>
                </div>
                <button class="add-btn" onclick="handleAddToCart(${item.id})">
                    Add to Cart
                </button>
            </div>
        `;
        productsGrid.innerHTML += cardTemplate;
    });
}

// Interaction handler for adding items to the cart. It checks the liveProducts array for a matching product ID and updates the globalCart state variable, then updates the cart badge display.
function handleAddToCart(productId) {
    // Scan our live database entries for a matching item id
    const productMatch = liveProducts.find(p => p.id === productId);
    
    if (productMatch) {
        globalCart.push(productMatch);
        updateCartBadge();
    }
}

function updateCartBadge() {
    if (cartCountDisplay) {
        cartCountDisplay.innerText = globalCart.length;
    }
}

// Initial data fetch when the app loads

// Trigger the cloud fetch request immediately when the file loads
fetchProductsFromDatabase();