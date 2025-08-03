// lib/api.js

// Remove the node-fetch import - use browser's built-in fetch instead
export async function getProducts() {
    const res = await fetch('http://localhost:4000/api/products', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
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