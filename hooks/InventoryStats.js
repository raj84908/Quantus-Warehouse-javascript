//This file is used to get the Inventory Statistics For the Dashboard and Inventory pages.
"use client";

import { useState, useEffect, useCallback } from "react";
import { getProducts } from "../lib/api";

export function useInventoryStats() {
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchInventory = useCallback(async () => {
        try {
            setLoading(true);
            const items = await getProducts();
            setInventoryItems(items);
        } catch (error) {
            console.error("Failed to fetch inventory:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    // Stats
    const totalItems = inventoryItems.length;
    const lowStock = inventoryItems.filter(
        (item) => item.stock <= item.minStock && item.stock > 0
    ).length;
    const outOfStock = inventoryItems.filter((item) => item.stock === 0).length;
    const totalValue = inventoryItems.reduce(
        (sum, item) => sum + item.value * item.stock,
        0
    );

    return {
        inventoryItems,
        loading,
        stats: {
            totalItems,
            lowStock,
            outOfStock,
            totalValue,
        },
        refresh: fetchInventory,
    };
}
