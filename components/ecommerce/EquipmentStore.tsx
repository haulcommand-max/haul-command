import React from 'react';

const PRODUCTS = [
  {
    id: 'p1',
    name: "Complete Escort Compliance Kit (NY/PA/OH)",
    description: "The legally required kit: 18-inch wire-loop flags, magnetic 'Oversize Load' banner, and DOT-approved rotating amber beacon. Drop-shipped directly to your driveway.",
    price: 349.99,
    image: "/store/compliance-kit.jpg",
    category: "Bundles",
    tag: "Best Seller"
  },
  {
    id: 'p2',
    name: "Heavy Duty Height Pole (20ft, Fiberglass)",
    description: "Telescoping non-conductive height pole. Essential for loads over 14'6. Quick-mount base included.",
    price: 189.99,
    image: "/store/height-pole.jpg",
    category: "Equipment"
  },
  {
    id: 'p3',
    name: "LED 'Oversize Load' Light Bar (Double Face)",
    description: "High-visibility double-faced LED sign. Wired for standard 12V. Compliant with strict WA and OR illumination rules.",
    price: 599.99,
    image: "/store/light-bar.jpg",
    category: "Lighting"
  },
  {
    id: 'p4',
    name: "Magnetic Safety Flags (Pack of 4)",
    description: "Scratch-resistant ceramic magnets holding 18\" fluorescent orange mesh flags. Tests up to 85mph.",
    price: 45.00,
    image: "/store/flags.jpg",
    category: "Accessories"
  }
];

export default function EquipmentStore() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-900/40 to-black py-20 px-8 border-b border-orange-900/50">
        <div className="max-w-6xl mx-auto">
          <span className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-4 block">Haul Command E-Commerce</span>
          <h1 className="text-5xl font-black mb-6">The Amazon of Heavy Haul</h1>
          <p className="text-xl text-gray-400 max-w-2xl">
            Fully DOT-compliant pilot car and operator equipment. Ordered with one click. 
            Drop-shipped directly to your door from our trusted manufacturing partners.
          </p>
        </div>
      </div>

      {/* Storefront Grid */}
      <div className="max-w-6xl mx-auto py-16 px-8">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold">Featured Compliance Gear</h2>
          <div className="flex gap-4">
            <button className="px-4 py-2 rounded-full border border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-sm">All Gear</button>
            <button className="px-4 py-2 rounded-full border border-gray-700 hover:bg-gray-800 text-sm">State Kits</button>
            <button className="px-4 py-2 rounded-full border border-gray-700 hover:bg-gray-800 text-sm">Lighting</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCTS.map(product => (
            <div key={product.id} className="bg-[#0f0f11] rounded-xl border border-gray-800 overflow-hidden group hover:border-orange-500/50 transition-colors">
              <div className="h-48 bg-gray-900 relative flex items-center justify-center border-b border-gray-800 group-hover:bg-gray-800/50 transition-colors">
                {/* Mock Image Placeholder */}
                <span className="text-4xl text-gray-700">🛒</span>
                {product.tag && (
                  <span className="absolute top-3 right-3 bg-orange-600 text-xs font-bold px-2 py-1 rounded">
                    {product.tag}
                  </span>
                )}
              </div>
              <div className="p-5">
                <span className="text-xs text-orange-500 font-bold uppercase tracking-wider">{product.category}</span>
                <h3 className="font-bold text-lg mt-1 mb-2 leading-tight h-12">{product.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">{product.description}</p>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                  <button className="bg-white text-black hover:bg-gray-200 font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dropship/Customization Scenario Block */}
        <div className="mt-24 p-8 bg-orange-900/10 border border-orange-900/30 rounded-2xl flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-4 text-orange-500">How We Run This Without Inventory</h3>
            <ul className="space-y-4 text-gray-300">
              <li className="flex gap-3">
                <span className="text-xl">🛠️</span>
                <div>
                  <strong className="text-white">Dropship Integration:</strong> We connect this storefront via API directly to manufacturers like BuildASign or AW Direct. Orders flow directly to them.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">📦</span>
                <div>
                  <strong className="text-white">Subscription Kits:</strong> Users can subscribe to flagged equipment replacements. Banners fade in the sun—we auto-ship new ones every 6 months.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">💳</span>
                <div>
                  <strong className="text-white">Deducted from Escrow:</strong> Because operators get paid via Stripe QuickPay on our platform, we can allow them to buy gear and deduct it straight from their next load payout.
                </div>
              </li>
            </ul>
          </div>
          <div className="flex-1 bg-black p-6 rounded-xl border border-gray-800">
            <div className="text-sm text-gray-500 font-mono mb-2">// Automated Fulfillment Logic</div>
            <pre className="text-xs text-green-400 overflow-x-auto">
{`const createDropshipOrder = async (cart) => {
  const vendor = routeOrderToVendor(cart);
  await vendor.api.submitOrder({
     items: cart.items,
     shippingDetails: user.profile.address,
     whiteLabel: {
        logo: "Haul Command",
        packingSlip: true
     }
  });
  return "Order sent to fulfillment!";
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
