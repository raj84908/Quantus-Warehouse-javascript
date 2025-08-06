// lib/api.js

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
        ? `http://localhost:4000/api/products?${params.toString()}`
        : 'http://localhost:4000/api/products';

    console.log('Fetching URL:', url); // Debug log
    
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    
    console.log('Received data:', data); // Debug log
    return data;
}

export async function addProduct(productData) {
    const res = await fetch('http://localhost:4000/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
    });
    if (!res.ok) throw new Error('Failed to add product');
    return res.json();
}