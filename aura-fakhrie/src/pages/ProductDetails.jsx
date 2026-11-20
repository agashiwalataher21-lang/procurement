import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { Star, Heart, ShoppingBag, ArrowLeft, Share2, CheckCircle, XCircle, ChevronDown } from 'lucide-react'

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const [product, setProduct] = useState(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [relatedProducts, setRelatedProducts] = useState([])

  useEffect(() => {
    // Simulate product data based on ID
    const sampleProducts = {
      1: {
        id: 1,
        name: 'Premium Cotton T-Shirt - Men',
        price: 29.99,
        originalPrice: 39.99,
        description: 'High quality 100% cotton t-shirt with comfortable fit for everyday wear. Breathable fabric that keeps you cool all day.',
        features: ['100% Organic Cotton', 'Pre-shrunk fabric', 'Soft touch finish', 'Durable stitching'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Black', 'White', 'Navy Blue', 'Heather Gray'],
        ratings: { average: 4.8, total: 124 },
        stock: 50,
        category: 'Men',
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
          'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
          'https://images.unsplash.com/photo-1618408419303-71d149839f16?w=800',
        ],
      },
      2: {
        id: 2,
        name: 'Women Stylish Blouse - Floral',
        price: 49.99,
        originalPrice: 69.99,
        description: 'Elegant sleeve blouse perfect for office and casual wear. Made with premium fabric and beautiful floral pattern.',
        features: ['Premium chiffon fabric', 'Elegant sleeve design', 'Floral pattern', 'Versatile styling'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Pink', 'White', 'Navy'],
        ratings: { average: 4.9, total: 89 },
        stock: 30,
        category: 'Women',
        images: [
          'https://images.unsplash.com/photo-1572804023308-07882115d97b?w=800',
          'https://images.unsplash.com/photo-1596787156955-6904535f29fa?w=800',
          'https://images.unsplash.com/photo-1564272903358-6491897443ee?w=800',
        ],
      },
      3: {
        id: 3,
        name: 'Baby Cotton Romper - Organic',
        price: 19.99,
        description: 'Soft organic cotton romper gentle on baby\'s skin. Easy snap buttons for quick changes.',
        features: ['100% Organic Cotton', 'Hypoallergenic', 'Easy snap buttons', 'Machine washable'],
        sizes: ['0-3 months', '3-6 months', '6-12 months', '12-18 months'],
        colors: ['White', 'Pastel Blue', 'Pastel Pink'],
        ratings: { average: 4.7, total: 210 },
        stock: 100,
        category: 'Baby',
        images: [
          'https://images.unsplash.com/photo-1519834103483-96b71cb92e30?w=800',
          'https://images.unsplash.com/photo-1517788382959-261b53435b09?w=800',
        ],
      },
    }

    const productData = sampleProducts[id] || {
      id: id,
      name: 'Premium Cotton T-Shirt',
      price: 29.99,
      originalPrice: 39.99,
      description: 'High quality 100% cotton t-shirt with comfortable fit for everyday wear.',
      features: ['100% Organic Cotton', 'Pre-shrunk fabric', 'Soft touch finish'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'White', 'Blue'],
      ratings: { average: 4.8, total: 124 },
      stock: 50,
      category: 'Men',
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
    }

    setProduct(productData)

    // Set default size and color
    if (productData.sizes.length > 0) setSelectedSize(productData.sizes[0])
    if (productData.colors.length > 0) setSelectedColor(productData.colors[0])

    // Load related products
    setRelatedProducts([
      { id: 4, name: 'Men\'s Denim Jeans', price: 59.99, image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300' },
      { id: 5, name: 'Women\'s Yoga Pants', price: 34.99, image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=300' },
      { id: 6, name: 'Organic Baby Diapers', price: 24.99, image: 'https://images.unsplash.com/photo-1517788382959-261b53435b09?w=300' },
    ])
  }, [id])

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        size: selectedSize,
        color: selectedColor,
      }, quantity)
    }
  }

  const toggleWishlist = () => {
    if (product && !isInWishlist(product.id)) {
      addToWishlist({ id: product.id, name: product.name, price: product.price, image: product.images[0] })
    } else if (product) {
      removeFromWishlist(product.id)
    }
  }

  const renderStars = (rating) => {
    return (
      <div className="flex text-orange-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= Math.round(rating) ? 'fill-current' : 'text-gray-300'}
          />
        ))}
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-blue-600">Home</Link></li>
            <li><span className="mx-2">/</span></li>
            <li><Link to="/shop" className="hover:text-blue-600">Shop</Link></li>
            <li><span className="mx-2">/</span></li>
            <li className="text-gray-900 font-medium">{product.category}</li>
            <li><span className="mx-2">/</span></li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="mb-4">
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-[500px] object-cover rounded-xl"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`relative overflow-hidden rounded-lg ${activeImage === index ? 'ring-2 ring-blue-600' : ''}`}
                >
                  <img src={img} alt={`View ${index + 1}`} className="w-full h-24 object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {product.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {renderStars(product.ratings.average)}
                  <span className="ml-2 font-semibold">{product.ratings.average}</span>
                </div>
                <span className="text-sm text-gray-500">{product.ratings.total} reviews</span>
              </div>
              <div className="h-6 w-px bg-gray-300" />
              <span className="text-green-600 font-medium flex items-center gap-1">
                <CheckCircle size={18} />
                In Stock ({product.stock} available)
              </span>
            </div>

            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
              )}
            </div>

            <p className="text-gray-600 mb-8 leading-relaxed">{product.description}</p>

            {/* Features */}
            {product.features && (
              <div className="mb-8">
                <h3 className="font-semibold mb-3">Features</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-600">
                      <CheckCircle size={18} className="text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Select Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 rounded-lg font-medium transition ${
                        selectedSize === size
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Select Color</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        selectedColor === color
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center py-2 border-l border-r"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2"
              >
                <ShoppingBag size={20} />
                Add to Cart - ${(product.price * quantity).toFixed(2)}
              </button>
            </div>

            {/* Wishlist & Share */}
            <div className="flex gap-4">
              <button
                onClick={toggleWishlist}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition ${
                  isInWishlist(product.id)
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'border-gray-300 hover:border-red-300 text-gray-700'
                }`}
              >
                <Heart size={20} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                {isInWishlist(product.id) ? 'In Wishlist' : 'Add to Wishlist'}
              </button>
              <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition">
                <Share2 size={20} />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Related Products - Customers Also Bought */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-8">Customers Also Bought</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((related) => (
              <Link
                key={related.id}
                to={`/product/${related.id}`}
                className="bg-white rounded-lg p-4 hover:shadow-xl transition duration-300"
              >
                <div className="relative">
                  <img
                    src={related.image}
                    alt={related.name}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{related.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-blue-600">${related.price.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Arrivals */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Recent Arrivals</h2>
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
                    alt="New Product"
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                  <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                    New
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Latest Collection Product {i}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-blue-600">$29.99</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetails
