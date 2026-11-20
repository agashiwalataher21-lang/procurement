import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useUser } from '../contexts/UserContext'
import { CreditCard, Banknote, ChevronRight, CheckCircle, Lock } from 'lucide-react'

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart()
  const { isAuthenticated } = useUser()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')

  const shipping = cartTotal > 50 ? 0 : 5
  const tax = cartTotal * 0.08
  const grandTotal = cartTotal + shipping + tax

  const handlePlaceOrder = () => {
    // Simulate order placement
    clearCart()
    setStep(3) // Success step
    setTimeout(() => {
      navigate('/order-tracking')
    }, 3000)
  }

  if (cart.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-12 mt-4 text-sm text-gray-600">
            <span className={step >= 1 ? 'font-semibold text-blue-600' : ''}>Details</span>
            <span className={step >= 2 ? 'font-semibold text-blue-600' : ''}>Payment</span>
            <span className={step === 3 ? 'font-semibold text-blue-600' : ''}>Confirm</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            {/* Shipping Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" defaultValue="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" defaultValue="Doe" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" defaultValue="john@example.com" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" defaultValue="123 Main St" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" defaultValue="Dubai" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP Code</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" defaultValue="12345" />
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Shipping Method</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-blue-500">
                  <input type="radio" name="shipping" defaultChecked className="text-blue-600" />
                  <div className="flex-1">
                    <div className="font-medium">Standard Delivery (3-5 days)</div>
                    <div className="text-sm text-gray-500">Free</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-blue-500">
                  <input type="radio" name="shipping" className="text-blue-600" />
                  <div className="flex-1">
                    <div className="font-medium">Express Delivery (1-2 days)</div>
                    <div className="text-sm text-gray-500">$15.00</div>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              Continue to Payment <ChevronRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Payment Options */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:border-blue-500 ${paymentMethod === 'bank_transfer' ? 'border-blue-600 bg-blue-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="mt-1 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <Banknote size={20} />
                        Bank Transfer
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Transfer funds to our bank account. Your order will be processed once payment is received.
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:border-blue-500 ${paymentMethod === 'credit_card' ? 'border-blue-600 bg-blue-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => setPaymentMethod('credit_card')}
                      className="mt-1 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <CreditCard size={20} />
                        Credit Card
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Pay securely with your credit card.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {paymentMethod === 'credit_card' && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Card Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Card Number</label>
                      <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Cardholder Name</label>
                      <input type="text" className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Expiry</label>
                        <input type="text" placeholder="MM/YY" className="w-full px-4 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">CVV</label>
                        <input type="text" className="w-full px-4 py-2 border rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <div className="text-gray-500 text-sm">
                        {item.quantity} x ${item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-blue-600 pt-2 border-t">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 mt-6"
              >
                <Lock size={20} />
                Place Order - ${grandTotal.toFixed(2)}
              </button>
              <p className="text-center text-sm text-gray-500 mt-3 flex items-center justify-center gap-2">
                <Lock size={14} />
                Secure payment encrypted
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Order Placed Successfully!</h2>
            <p className="text-gray-600 mb-8">
              Thank you for your order. We'll send you a confirmation email with your order details and tracking information.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Banknote size={20} className="text-blue-600" />
                <span className="font-semibold">Bank Transfer Details</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Bank: Dubai Islamic Bank</p>
              <p className="text-sm text-gray-600 mb-2">Account: 1234567890</p>
              <p className="text-sm text-gray-600">Reference: Order #{Math.floor(Math.random() * 100000)}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Checkout
