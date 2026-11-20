import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Filter, SlidersHorizontal, X, ChevronDown, Star } from 'lucide-react'

const Shop = () => {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('featured')
  const [priceRange, setPriceRange] = useState([0, 200])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedSizes, setSelectedSizes] = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const categories = ['Men', 'Women', 'Baby', 'Accessories', 'Footwear']
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
  const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Pink', 'Gray']

  useEffect(() => {
    const sampleProducts = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: [
        'Premium Cotton T-Shirt', 'Women Stylish Blouse', 'Baby Cotton Romper',
        'Men Denim Jeans', 'Summer Dress', 'Organic Baby Diapers',
        'Running Shoes Men', 'Yoga Pants Women', 'Wool Sweater',
        'Formal Shirt Men', 'Casual Skirt', 'Baby Sleepwear',
        'Leather Jacket', 'Floral Blouse', 'Pants Suit',
        'Sneakers Kids', 'Maternity Dress', 'Winter Jacket',
        'Shorts Summer', 'Evening Gown', 'Polo Shirt',
        'Leggings Yoga', 'Cardigan Knit', 'Sun Dress',
        'Trench Coat', 'Hoodie Cotton', 'Pajamas Set',
        'Socks Pack', 'Underwear Boxer', 'Bathing Suit',
        'Scarf Winter', 'Gloves Leather', 'Hat Baseball',
        'Belt Leather', 'Watch Classic', 'Sunglasses UV',
        'Backpack Travel', 'Wallet Leather', 'Shoes Boots',
        'Sandals Summer', 'Heels Stiletto', 'Flats Comfort',
        'Loafers Shoes', 'Slippers Home', 'Sandal Kids'
      ][i % 50] + (i >= 50 ? ` - Style ${i}` : ''),
      price: 15 + Math.random() * 150,
      originalPrice: (15 + Math.random() * 150) * 1.2,
      rating: 3 + Math.random() * 2,
      reviews: Math.floor(Math.random() * 200) + 10,
      image: `https://images.unsplash.com/photo-${['1521572163474-6864f9cf17ab', '1572804023308-07882115d97b', '1519834103483-96b71cb92e30', '1552053831-71594a27632d'][Math.floor(Math.random() * 4)]}?w=500`,
      category: categories[Math.floor(Math.random() * categories.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      stock: Math.floor(Math.random() * 100),
    }))
    setProducts(sampleProducts)
    setLoading(false)
  }, [])

  useEffect(() => {
    let result = [...products]

    // Search filter
    const search = searchParams.get('search')
    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category))
    }

    // Price filter
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])

    // Sort
    switch (sortBy) {
      case 'low-high':
        result.sort((a, b) => a.price - b.price)
        break
      case 'high-low':
        result.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        result.sort((a, b) => b.id - a.id)
        break
      default:
        // Featured - random
        result.sort(() => Math.random() - 0.5)
    }

    setFilteredProducts(result)
  }, [products, searchParams, selectedCategories, priceRange, sortBy])

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    )
  }

  const toggleSize = (size) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    )
  }

  const toggleColor = (color) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    )
  }

  const resetFilters = () => {
    setSelectedCategories([])
    setSelectedSizes([])
    setSelectedColors([])
    setPriceRange([0, 200])
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Shop All</h1>
            <p className="text-gray-500 mt-1">{filteredProducts.length} products found</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm"
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="featured">Featured</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest Arrivals</option>
              </select>
              <SlidersHorizontal size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden md:block w-64 space-y-8">
            <div>
              <h3 className="font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label key={category} className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Price Range</h3>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="10"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>$0</span>
                  <span>${priceRange[1]}+</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Sizes</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1 rounded border text-sm transition ${
                      selectedSizes.includes(size)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Colors</h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => toggleColor(color)}
                    className={`px-3 py-1 rounded border text-sm transition ${
                      selectedColors.includes(color)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={resetFilters}
              className="w-full py-2 text-gray-600 hover:text-red-600 transition flex items-center justify-center gap-2"
            >
              <X size={16} />
              Clear All Filters
            </button>
          </aside>

          {/* Mobile Filter Modal */}
          {isMobileFilterOpen && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setIsMobileFilterOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl z-50 overflow-y-auto">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="font-bold text-xl">Filters</h2>
                  <button onClick={() => setIsMobileFilterOpen(false)}>
                    <X size={24} />
                  </button>
                </div>
                <div className="p-4 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Categories</h3>
                    {categories.map((category) => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="rounded text-blue-600"
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Price Range</h3>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="10"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm mt-2">
                      <span>$0</span>
                      <span>${priceRange[1]}+</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Sizes</h3>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={`px-3 py-1 rounded border text-sm ${
                            selectedSizes.includes(size)
                              ? 'bg-blue-600 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Colors</h3>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => toggleColor(color)}
                          className={`px-3 py-1 rounded border text-sm ${
                            selectedColors.includes(color)
                              ? 'bg-blue-600 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={resetFilters}
                    className="w-full py-2 text-red-600 font-medium"
                  >
                    Clear All Filters
                  </button>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold"
                  >
                    Show {filteredProducts.length} Results
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
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
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 truncate hover:text-blue-600 cursor-pointer">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{product.category}</p>
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
                      <span className="text-sm text-gray-400 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters</p>
                <button
                  onClick={resetFilters}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Shop
