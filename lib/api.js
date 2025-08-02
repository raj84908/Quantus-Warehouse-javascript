// lib/api.js

import fetch from 'node-fetch';
export async function getProducts() {
    const res = await fetch('http://localhost:4000/api/products', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}
