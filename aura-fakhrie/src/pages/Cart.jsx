import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { X, Minus, Plus, Trash2, ShoppingBag, CheckCircle, CreditCard } from 'lucide-react'

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart()
  const navigate = useNavigate()
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setDiscount(cartTotal * 0.1)
    } else if (couponCode.toUpperCase() === 'SAVE20') {
      setDiscount(Math.min(cartTotal * 0.2, 50))
    }
  }

  const handleCheckout = () => {
    navigate('/checkout')
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-white rounded-xl p-12 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={40} className="text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  const shipping = cartTotal - discount > 50 ? 0 : 5
  const tax = (cartTotal - discount) * 0.08
  const grandTotal = cartTotal - discount + shipping + tax

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={`${item.id}-${item.size || 'no-size'}`} className="bg-white rounded-xl p-6 flex gap-6 shadow-sm">
                <div className="w-32 h-32 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">
                    {item.color && `Color: ${item.color} `} {item.size && `| Size: ${item.size}`}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="px-3 py-1 hover:bg-gray-100"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-4 py-1 font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 hover:bg-gray-100"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600">-${discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (8%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold text-blue-600">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Coupon Code */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition"
                  >
                    Apply
                  </button>
                </div>
                {couponCode.toUpperCase() === 'WELCOME10' && (
                  <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                    <CheckCircle size={16} />
                    10% discount applied!
                  </p>
                )}
                {couponCode.toUpperCase() === 'SAVE20' && (
                  <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                    <CheckCircle size={16} />
                    20% discount applied (max $50)!
                  </p>
                )}
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <CreditCard size={20} />
                Proceed to Checkout
              </button>

              <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <CheckCircle size={16} className="text-green-500" />
                  Secure Checkout
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle size={16} className="text-green-500" />
                  Free Returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
