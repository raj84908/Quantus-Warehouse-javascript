// lib/api.js


const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export async function getProducts(search = "", category = "all") {
    // Construct the URL with query parameters
    const params = new URLSearchParams();
    
    if (search) {
        params.append('search', search);
    }
    
    if (category && category !== 'all') {
        params.append('category', category);
    }
    
    const url = params.toString() 
        ? `${API_BASE}/api/products?${params.toString()}`
        : `${API_BASE}/api/products`;

    console.log('Fetching URL:', url); // Debug log
    
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    
    console.log('Received data:', data); // Debug log
    return data;
}

export async function addProduct(productData) {
    const res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
    });
    if (!res.ok) throw new Error('Failed to add product');
    return res.json();
}