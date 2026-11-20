import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'

const OrderTracking = () => {
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Simulate order status updates
    const timer = setInterval(() => {
      if (order && order.status !== 'Delivered') {
        setOrder(prev => {
          const statuses = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered']
          const currentIndex = statuses.indexOf(prev.status)
          if (currentIndex < statuses.length - 1) {
            return { ...prev, status: statuses[currentIndex + 1] }
          }
          return prev
        })
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [order])

  const handleTrack = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setOrder({
        id: 'ORD-' + Math.floor(Math.random() * 100000),
        date: '2026-11-05',
        items: [
          { name: 'Premium Cotton T-Shirt', price: 29.99, qty: 1, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100' },
          { name: 'Men\'s Denim Jeans', price: 59.99, qty: 1, image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100' },
        ],
        total: 89.98,
        status: 'Processing',
        shipping: { name: 'John Doe', address: '123 Main St, Dubai, UAE', method: 'Standard Delivery' },
        tracking: { number: '1Z999AA10123456784', carrier: 'DHL' },
        timeline: [
          { status: 'Processing', date: '2026-11-05', completed: true },
          { status: 'Shipped', date: 'TBD', completed: false },
          { status: 'Out for Delivery', date: 'TBD', completed: false },
          { status: 'Delivered', date: 'TBD', completed: false },
        ],
      })
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Track Your Order</h1>
          <p className="text-gray-600">Enter your order ID to check the status</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} className="mb-12 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Order ID (e.g., ORD-12345)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>

        {/* Order Status Display */}
        {order && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Order Header */}
            <div className="bg-blue-600 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-blue-200">Order Number</span>
                  <div className="text-xl font-bold">{order.id}</div>
                </div>
                <div className={`px-4 py-2 rounded-lg font-semibold ${
                  order.status === 'Delivered' ? 'bg-green-500' :
                  order.status === 'Out for Delivery' ? 'bg-orange-500' :
                  'bg-blue-400'
                }`}>
                  {order.status}
                </div>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <span>Placed on {order.date}</span>
                <span>•</span>
                <span>{order.items.length} items</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6">
              <h3 className="font-semibold mb-6">Order Status Timeline</h3>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200" />

                {order.timeline.map((step, index) => (
                  <div key={index} className="relative pl-12 mb-6">
                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 ${
                      step.completed
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-300'
                    }`}>
                      {step.completed && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                          {step.status}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {step.completed ? `Completed on ${step.date}` : 'In progress'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-gray-50 p-6 border-t">
              <h3 className="font-semibold mb-4">Shipping Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Recipient</div>
                  <div className="font-medium">{order.shipping.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Shipping Method</div>
                  <div className="font-medium">{order.shipping.method}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-500">Address</div>
                  <div className="font-medium">{order.shipping.address}</div>
                </div>
              </div>
            </div>

            {/* Tracking Info */}
            {order.tracking && (
              <div className="bg-gray-50 p-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <Search size={20} className="text-blue-600" />
                  <h3 className="font-semibold">Tracking Information</h3>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Carrier</div>
                    <div className="font-medium">{order.tracking.carrier}</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Tracking Number</div>
                    <div className="font-mono font-medium">{order.tracking.number}</div>
                  </div>
                </div>
                <a
                  href={`https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${order.tracking.number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
                >
                  Track on {order.tracking.carrier} Website
                </a>
              </div>
            )}

            {/* Order Items */}
            <div className="p-6 border-t">
              <h3 className="font-semibold mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-gray-500 text-sm">Qty: {item.qty}</div>
                    </div>
                    <div className="font-medium">${item.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 p-6 border-t">
              <div className="flex justify-between text-gray-600 mb-2">
                <span>Subtotal</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 mb-2">
                <span>Shipping</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-gray-600 mb-2">
                <span>Tax</span>
                <span>$7.20</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-blue-600 pt-2 border-t">
                <span>Total Paid</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-6 border-t flex gap-4">
              <Link
                to="/shop"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition text-center"
              >
                Continue Shopping
              </Link>
              <Link
                to="/account"
                className="flex-1 bg-white border text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition text-center"
              >
                View My Orders
              </Link>
            </div>
          </div>
        )}

        {/* No Order Display */}
        {!order && !loading && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Track Your Order</h3>
            <p className="text-gray-500">
              Enter your order ID above to see real-time delivery status.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderTracking
