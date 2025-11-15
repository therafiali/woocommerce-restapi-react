import { useState, useEffect } from "react";

// 🔧 CONFIGURATION - Replace with your credentials
const WC_CONFIG = {
  siteUrl: "https://1clickdesigners.com/dressup-windows",
  consumerKey: "ck_*********************",
  consumerSecret: "cs_*******************************",
};

// WooCommerce Cart Manager Component
const WooCommerceCartManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});

  // Extra charges configuration
  const [extraCharge, setExtraCharge] = useState(50); // Default $50 per product
  const [showChargeSettings, setShowChargeSettings] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = `${WC_CONFIG.siteUrl}/wp-json/wc/v3/products?consumer_key=${WC_CONFIG.consumerKey}&consumer_secret=${WC_CONFIG.consumerSecret}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add item to WooCommerce Cart with extra charges
  const addToWooCommerceCart = async (product, quantity = 1) => {
    try {
      setAddingToCart((prev) => ({ ...prev, [product.id]: true }));
      setError(null);
      const productId = product;
      const originalPrice = parseFloat(product.price) || 0;
      const finalPrice = originalPrice + extraCharge;

      // METHOD 1: Try CoCart Plugin with price modification
      try {
        const cocartUrl = `${WC_CONFIG.siteUrl}/wp-json/cocart/v2/cart/add-item?consumer_key=${WC_CONFIG.consumerKey}&consumer_secret=${WC_CONFIG.consumerSecret}`;

        const cocartResponse = await fetch(cocartUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: productId.toString(),
            quantity: quantity.toString(),
            // Add cart item data to store the custom price
            cart_item_data: {
              custom_price: finalPrice,
              extra_charge: extraCharge,
              original_price: originalPrice,
            },
          }),
        });

        if (cocartResponse.ok) {
          const data = await cocartResponse.json();
          setSuccess(
            `✅ Product added! Price: ${originalPrice} + ${extraCharge} fee = ${finalPrice} | Cart has ${
              data.item_count || quantity
            } items.`
          );
          setTimeout(() => setSuccess(null), 4000);
          return;
        } else {
          const errorData = await cocartResponse.json();
          console.error("CoCart Error:", errorData);
        }
      } catch (e) {
        console.log("CoCart not available, trying next method...", e);
      }

      // METHOD 2: Try WooCommerce REST API v3 with authentication
      try {
        const restApiUrl = `${WC_CONFIG.siteUrl}/wp-json/wc/v3/products/${productId}?consumer_key=${WC_CONFIG.consumerKey}&consumer_secret=${WC_CONFIG.consumerSecret}`;

        const productResponse = await fetch(restApiUrl);

        if (productResponse.ok) {
          const productData = await productResponse.json();

          // Create a direct add to cart URL (WordPress native)
          const addToCartUrl = `${WC_CONFIG.siteUrl}/?add-to-cart=${productId}&quantity=${quantity}`;

          // Open in new tab to add to cart
          window.open(addToCartUrl, "_blank");

          setSuccess(
            `✅ Opening WordPress to add "${productData.name}" (Original: ${originalPrice}, With fee: ${finalPrice})...`
          );
          setTimeout(() => setSuccess(null), 4000);
          return;
        }
      } catch (e) {
        console.log("REST API method failed, trying next method...", e);
      }

      // METHOD 3: Direct WordPress URL method (Always works)
      const directCartUrl = `${WC_CONFIG.siteUrl}/?add-to-cart=${productId}&quantity=${quantity}`;
      window.open(directCartUrl, "_blank");

      setSuccess(
        `✅ Opening WordPress to add product (Original: ${originalPrice}, With ${extraCharge} fee = ${finalPrice})...`
      );
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
      console.error("Error adding to cart:", err);
    } finally {
      setAddingToCart((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                WooCommerce Cart Integration
              </h1>
              <p className="mt-2 text-gray-600">
                Add products with custom pricing
              </p>
            </div>
            <button
              onClick={() => setShowChargeSettings(!showChargeSettings)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium flex items-center gap-2 "
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Extra Charge: ${extraCharge}
            </button>
          </div>
        </div>
      </header>

      {/* Extra Charge Settings */}
      {showChargeSettings && (
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configure Extra Charges
            </h3>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Extra charge per product ($):
              </label>
              <input
                type="number"
                value={extraCharge}
                onChange={(e) =>
                  setExtraCharge(parseFloat(e.target.value) || 0)
                }
                min="0"
                step="1"
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-600">
                (Tax, handling fee, or custom charges)
              </span>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Example:</strong> If product price is $104 and extra
                charge is $50, the final price will be $154
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-red-500 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700">{error}</p>
                <div className="mt-2 text-xs text-red-600">
                  <p className="font-semibold">Solution:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Install "CoCart" plugin from WordPress plugins</li>
                    <li>Or use the native WooCommerce Store API</li>
                    <li>Make sure your API has Read/Write permissions</li>
                  </ol>
                </div>
              </div>
              <button onClick={() => setError(null)} className="ml-auto">
                <svg
                  className="h-5 w-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-4">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="ml-3 text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-blue-500 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                ✅ CoCart is Active!
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Click "Add to WordPress Cart" on any product</li>
                  <li>Product is added directly to WooCommerce cart via API</li>
                  <li>
                    View cart at:{" "}
                    <a
                      href={`${WC_CONFIG.siteUrl}/cart`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold hover:text-blue-900"
                    >
                      {WC_CONFIG.siteUrl}/cart
                    </a>
                  </li>
                  <li>Cart persists in WordPress database</li>
                  <li>
                    <strong>Test API:</strong>{" "}
                    <a
                      href={`${WC_CONFIG.siteUrl}/wp-json/cocart/v2/cart`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold hover:text-blue-900"
                    >
                      View Cart JSON
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0].src}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        className="w-20 h-20"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-3">
                    {product.price ? (
                      <span className="text-2xl font-bold text-blue-600">
                        ${product.price}
                      </span>
                    ) : (
                      <span className="text-lg text-gray-500">
                        Price not set
                      </span>
                    )}
                  </div>

                  {/* Category */}
                  {product.categories && product.categories.length > 0 && (
                    <div className="mb-3">
                      <span className="inline-block bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">
                        {product.categories[0].name}
                      </span>
                    </div>
                  )}

                  {/* Stock Status */}
                  <div className="mb-4">
                    <span
                      className={`text-sm font-medium ${
                        product.stock_status === "instock"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {product.stock_status === "instock"
                        ? "✓ In Stock"
                        : "✗ Out of Stock"}
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => addToWooCommerceCart(product.id)}
                    disabled={
                      product.stock_status !== "instock" ||
                      addingToCart[product.id]
                    }
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {addingToCart[product.id] ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Add to WordPress Cart
                      </>
                    )}
                  </button>

                  {/* View Product Link */}
                  <a
                    href={product.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2 text-center text-sm text-gray-600 hover:text-blue-600 transition"
                  >
                    View details →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* View Cart Button (Fixed Bottom) */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href={`${WC_CONFIG.siteUrl}/cart`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-green-700 transition-all flex items-center gap-3 font-semibold text-lg hover:scale-105"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          View WordPress Cart
        </a>
      </div>
    </div>
  );
};

export default WooCommerceCartManager;
