import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { Star, ChevronRight } from 'lucide-react'

const CategoryPage = () => {
  const { category } = useParams()
  const { addToCart } = useCart()
  const [products, setProducts] = useState([])

  useEffect(() => {
    // Generate products for the category
    const categoryProducts = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `${category} Product ${i + 1} - Premium Quality`,
      price: 15 + Math.random() * 100,
      originalPrice: (15 + Math.random() * 100) * 1.2,
      rating: 3 + Math.random() * 2,
      reviews: Math.floor(Math.random() * 100),
      image: `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500`,
      category,
    }))
    setProducts(categoryProducts)
  }, [category])

  const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1)

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Category Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16 mb-8 rounded-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{formattedCategory}</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Discover our wide range of {formattedCategory.toLowerCase()} products.
            Premium quality, stylish designs, and unbeatable prices.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing {products.length} products in {formattedCategory}
          </p>
          <select className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Sort by: Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Top Rated</option>
          </select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="bg-white rounded-lg p-4 hover:shadow-xl transition duration-300 group"
            >
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-56 object-cover rounded-md mb-4"
                />
                {product.originalPrice && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                )}
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition">
                  <button className="w-full bg-blue-600 text-white py-2 rounded font-medium">
                        Quick View
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-orange-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-gray-500 text-sm">({product.reviews})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-blue-600">${product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Recommendations */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold mb-8">Customers Also Viewed</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Link
                key={i}
                to="/product/101"
                className="bg-white rounded-lg p-4 hover:shadow-xl transition duration-300"
              >
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"
                    alt="Recommended"
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Premium Cotton T-Shirt - Black</h3>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-orange-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < 5 ? 'fill-current' : 'text-gray-300'} />
                    ))}
                  </div>
                  <span className="text-gray-500 text-sm">(124)</span>
                </div>
                <span className="text-lg font-bold text-blue-600">$29.99</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Promotional Banner */}
        <div className="mt-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12 rounded-xl">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Subscribe & Save 10%!</h2>
              <p className="text-purple-100">Get exclusive offers and 10% off your first order.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryPage
