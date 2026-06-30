
//SUPABASE CONFIGURATION & INITIALIZATION

const SUPABASE_URL = "https://qwcpiltbfbnfikqlhrrg.supabase.co"; // 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Y3BpbHRiZmJuZmlrcWxocnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzY4ODIsImV4cCI6MjA5NDk1Mjg4Mn0.yHTBkF-rQaE-BK0RTcrVmmegqH3y-hgstBqr4P6LW1o"; // Paste your Anon Key

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// SECURITY WALL: CHECK FOR ACTIVE ADMIN SESSION

async function checkAdminSession() {
    // Ask Supabase if a user token is stored in this browser session
    const { data: { session } } = await supabaseClient.auth.getSession();

    // If no active token exists, bounce them right out to the login page immediately
    if (!session) {
        window.location.href = "Login.html";
    }
}
// Run the security gate immediately before any layout forms load
checkAdminSession();


//  UI DOCUMENT ELEMENT TARGETS

const addProductForm = document.getElementById('addProductForm');
const statusMessage = document.getElementById('statusMessage');

// EVENT LISTENER: LISTEN FOR FORM SUBMISSION

if (addProductForm) {
    addProductForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        showStatus("Processing product submission...", "loading");

        const nameValue        = document.getElementById('prodName').value;
        const priceValue       = document.getElementById('prodPrice').value;
        const categoryValue    = document.getElementById('prodCategory')?.value || null;
        const descriptionValue = document.getElementById('prodDescription')?.value || null;

        // Image inputs
        const fileInput1 = document.getElementById('prodFile');
        const fileInput2 = document.getElementById('prodFile2');
        const fileInput3 = document.getElementById('prodFile3');
        const urlInput1  = document.getElementById('prodImage').value;
        const urlInput2  = document.getElementById('prodImage2')?.value || null;
        const urlInput3  = document.getElementById('prodImage3')?.value || null;

        try {
            // Upload all three images (file takes priority over URL for each slot)
            showStatus("Uploading images...", "loading");
            const finalUrl1 = await uploadFileOrUrl(fileInput1, urlInput1);
            const finalUrl2 = await uploadFileOrUrl(fileInput2, urlInput2);
            const finalUrl3 = await uploadFileOrUrl(fileInput3, urlInput3);

            // Save everything into the products table
            showStatus("Saving product entry to database...", "loading");
            const { error: dbError } = await supabaseClient
                .from('products')
                .insert([
                    {
                        name:        nameValue,
                        price:       Number(priceValue),
                        image_url:   finalUrl1,
                        image_url_2: finalUrl2,
                        image_url_3: finalUrl3,
                        category:    categoryValue,
                        description: descriptionValue
                    }
                ]);

            if (dbError) throw dbError;

            showStatus("✓ Product successfully added to the shop", "success");
            addProductForm.reset();

        } catch (err) {
            console.error("Operation failed:", err.message);
            showStatus("✕ Error: " + err.message, "error");
        }
    });
}

// ── Reusable upload helper ──────────────────────────────────────
// Uploads a file to Supabase Storage if selected; otherwise uses the pasted URL.
// Returns the final public URL string, or null if neither is provided.
async function uploadFileOrUrl(fileInput, fallbackUrl) {
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const uniqueFileName = `${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabaseClient
            .storage
            .from('product-images')
            .upload(uniqueFileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseClient
            .storage
            .from('product-images')
            .getPublicUrl(uniqueFileName);

        return publicUrlData.publicUrl;
    }
    return fallbackUrl || null;
}

// Helper function to update our status text box
// 'type' is one of: 'loading' | 'success' | 'error'
function showStatus(text, type) {
    if (statusMessage) {
        statusMessage.textContent = text;
        statusMessage.className = 'status-msg visible ' + (type || 'loading');
    }
}
// Logout Handler
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = "Login.html";
    });
}