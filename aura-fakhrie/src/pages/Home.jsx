import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    setFeaturedProducts([
      {
        id: 1,
        name: 'Premium Cotton T-Shirt',
        price: 29.99,
        originalPrice: 39.99,
        rating: 4.8,
        reviews: 124,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        category: 'Men',
      },
      {
        id: 2,
        name: "Women's Stylish Blouse",
        price: 49.99,
        rating: 4.9,
        reviews: 89,
        image: 'https://images.unsplash.com/photo-1572804023308-07882115d97b?w=500',
        category: 'Women',
      },
      {
        id: 3,
        name: 'Baby Cotton Romper',
        price: 19.99,
        rating: 4.7,
        reviews: 210,
        image: 'https://images.unsplash.com/photo-1519834103483-96b71cb92e30?w=500',
        category: 'Baby',
      },
      {
        id: 4,
        name: "Men's Denim Jeans",
        price: 59.99,
        originalPrice: 79.99,
        rating: 4.6,
        reviews: 156,
        image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500',
        category: 'Men',
      },
    ])

    setBestSellers([
      {
        id: 5,
        name: "Women's Yoga Pants",
        price: 34.99,
        rating: 4.9,
        reviews: 342,
        image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500',
        category: 'Women',
      },
      {
        id: 6,
        name: 'Organic Baby Diapers',
        price: 24.99,
        rating: 4.8,
        reviews: 567,
        image: 'https://images.unsplash.com/photo-1517788382959-261b53435b09?w=500',
        category: 'Baby',
      },
      {
        id: 7,
        name: 'Running Shoes Men',
        price: 89.99,
        rating: 4.7,
        reviews: 234,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        category: 'Men',
      },
      {
        id: 8,
        name: 'Summer Dress',
        price: 69.99,
        rating: 4.9,
        reviews: 178,
        image: 'https://images.unsplash.com/photo-1572804023308-07882115d97b?w=500',
        category: 'Women',
      },
    ])

    setNewArrivals([
      {
        id: 9,
        name: 'Latest Men Collection',
        price: 39.99,
        rating: 4.5,
        reviews: 45,
        image: 'https://images.unsplash.com/photo-1596787156955-6904535f29fa?w=500',
        category: 'Men',
      },
      {
        id: 10,
        name: 'Newborn Essentials Set',
        price: 59.99,
        rating: 4.8,
        reviews: 89,
        image: 'https://images.unsplash.com/photo-1519785228722-387239b02795?w=500',
        category: 'Baby',
      },
    ])

    setCategories([
      { id: 1, name: 'Men', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400', count: 124 },
      { id: 2, name: 'Women', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', count: 156 },
      { id: 3, name: 'Baby', image: 'https://images.unsplash.com/photo-1519785228722-387239b02795?w=400', count: 89 },
      { id: 4, name: 'Accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6aaf6a?w=400', count: 67 },
      { id: 5, name: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', count: 45 },
    ])
  }, [])

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Premium Clothing &<br />
                <span className="text-orange-400">Baby Products</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 text-blue-100">
                Quality you can trust for your family. Stylish designs, comfortable fits,
                and unbeatable prices on everything you need.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/shop"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition flex items-center justify-center gap-2"
                >
                  Shop Now <ArrowRight size={20} />
                </Link>
                <Link
                  to="/baby"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-4 rounded-lg font-semibold text-lg transition"
                >
                  Shop Baby
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-orange-500/20 rounded-2xl blur-2xl" />
              <img
                src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800"
                alt="Fashion Collection"
                className="relative rounded-2xl shadow-2xl w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Shop by Category</h2>
          <Link to="/shop" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.name.toLowerCase()}`}
              className="group relative overflow-hidden rounded-xl cursor-pointer"
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-48 object-cover transform group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-bold text-xl mb-1">{category.name}</h3>
                <p className="text-gray-300 text-sm">{category.count} products</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="bg-white rounded-lg p-4 hover:shadow-xl transition duration-300 group"
              >
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-md mb-4"
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
        </div>
      </div>

      {/* Best Sellers */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Best Sellers</h2>
            <p className="text-gray-500 mt-2">Most popular products from our customers</p>
          </div>
          <Link to="/shop" className="hidden md:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
            View All Best Sellers <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="bg-white rounded-lg p-4 hover:shadow-xl transition duration-300"
            >
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-64 object-cover rounded-md mb-4"
                />
                <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                  Best Seller
                </span>
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
              <span className="text-lg font-bold text-blue-600">${product.price.toFixed(2)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Summer Sale - Up to 50% Off!</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Don't miss our biggest sale of the season. Premium clothing and baby products
            at unbeatable prices. Limited time offer!
          </p>
          <Link
            to="/shop"
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-bold text-lg transition"
          >
            Shop the Sale
          </Link>
        </div>
      </div>

      {/* New Arrivals */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">New Arrivals</h2>
              <p className="text-gray-500 mt-2">Fresh styles just arrived</p>
            </div>
            <Link to="/shop" className="hidden md:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
              View All New Arrivals <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="bg-white rounded-lg p-4 hover:shadow-xl transition duration-300"
              >
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-md mb-4"
                  />
                  <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                    New
                  </span>
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
                </div>
                <span className="text-lg font-bold text-blue-600">${product.price.toFixed(2)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Customers Also Bought */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Customers Also Bought</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Link
              key={i}
              to="/product/101"
              className="bg-white rounded-lg p-4 hover:shadow-xl transition duration-300"
            >
              <div className="relative">
                <img
                  src={`https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500`}
                  alt="Also Bought"
                  className="w-full h-64 object-cover rounded-md mb-4"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Premium Cotton T-Shirt - Black
              </h3>
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

      {/* Newsletter */}
      <div className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-gray-400 mb-8">
              Subscribe to our newsletter and get 10% off your first order plus
              exclusive offers and updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow px-6 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg font-semibold transition">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
