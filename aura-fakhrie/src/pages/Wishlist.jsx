import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../contexts/WishlistContext'
import { useCart } from '../contexts/CartContext'
import { Heart, Trash2, ShoppingBag, CheckCircle, Star } from 'lucide-react'

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [movedItem, setMovedItem] = useState(null)

  const handleMoveToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    }, 1)
    setMovedItem(product.id)
    setTimeout(() => setMovedItem(null), 2000)
  }

  const handleRemove = (productId) => {
    removeFromWishlist(productId)
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-white rounded-xl p-12 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={40} className="text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Wishlist</h1>
            <p className="text-gray-600 mb-8">
              Save your favorite products for later by adding them to your wishlist.
            </p>
            <Link
              to="/shop"
              className="bg-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-700 transition inline-flex items-center gap-2"
            >
              <ShoppingBag size={20} />
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Heart size={32} className="text-red-500" />
          <h1 className="text-3xl font-bold">Your Wishlist</h1>
          <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full ml-auto">
            {wishlist.length}
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((product) => (
            <div key={product.id} className="bg-white rounded-xl p-4 hover:shadow-xl transition duration-300">
              <div className="relative">
                <Link to={`/product/${product.id}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-lg cursor-pointer"
                  />
                </Link>
                <button
                  onClick={() => handleRemove(product.id)}
                  className="absolute top-3 right-3 bg-white text-red-500 p-2 rounded-full shadow-lg hover:bg-red-50 transition"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="mt-4">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-2 mb-3">
                  <div className="flex text-orange-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= 4 ? 'fill-current' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">(124)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveToCart(product)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                        movedItem === product.id
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {movedItem === product.id ? (
                        <>
                          <CheckCircle size={16} />
                          Moved!
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={16} />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Wishlist
