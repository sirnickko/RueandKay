
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
        showStatus("Processing product submission...", "var(--text-muted)");

        const nameValue = document.getElementById('prodName').value;
        const priceValue = document.getElementById('prodPrice').value;
        const urlInputValue = document.getElementById('prodImage').value;
        const fileInput = document.getElementById('prodFile');
        
        let finalImageUrl = urlInputValue || null;

        try {
            // Check if the admin selected a local file
            if (fileInput && fileInput.files.length > 0) {
                showStatus("Uploading file to cloud storage...","var(--accent)");
                
                const chosenFile = fileInput.files[0];
                
                // Create a unique filename using the current timestamp to avoid duplicate name overwrites
                const uniqueFileName = `${Date.now()}-${chosenFile.name}`;

                // Upload the file to your public 'product-images' bucket
                const { data: uploadData, error: uploadError } = await supabaseClient
                    .storage
                    .from('product-images')
                    .upload(uniqueFileName, chosenFile);

                if (uploadError) throw uploadError;

                // Grab the public web URL of the uploaded image file
                const { data: publicUrlData } = supabaseClient
                    .storage
                    .from('product-images')
                    .getPublicUrl(uniqueFileName);

                finalImageUrl = publicUrlData.publicUrl;
            }

            // Save everything into your products table
            showStatus("Saving product entry to database...", "var(--accent)");
            const { error: dbError } = await supabaseClient
                .from('products')
                .insert([
                    { name: nameValue, price: Number(priceValue), image_url: finalImageUrl }
                ]);

            if (dbError) throw dbError;

            showStatus("Product successfully added to the shop", "green");
            addProductForm.reset();

        } catch (err) {
            console.error("Operation failed:", err.message);
            showStatus(" Error: " + err.message, "red");
        }
    });
}

// Helper function to update our status text box
function showStatus(text, color) {
    if (statusMessage) {
        statusMessage.innerText = text;
        statusMessage.style.color = color;
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