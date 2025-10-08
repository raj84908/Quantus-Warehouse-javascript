export const metadata = {
    title: "Shopify Integration",
    description: "Connect and sync your Shopify store with Quantus Warehouse",
  };
  
  export default function ShopifyPage() {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold mb-4">Shopify Integration</h1>
        <p className="text-gray-600 mb-6">
          Connect your Shopify store to Quantus Warehouse to sync inventory,
          orders, and products automatically.
        </p>
  
        <div className="border rounded-2xl p-6 shadow-sm bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-semibold mb-2">Setup Instructions</h2>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            <li>Click “Connect Shopify” to authenticate your store.</li>
            <li>Approve the Quantus app permissions in your Shopify admin.</li>
            <li>Wait for sync confirmation.</li>
          </ul>
  
          <button className="mt-6 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800">
            Connect Shopify
          </button>
        </div>
      </main>
    );
  }
  