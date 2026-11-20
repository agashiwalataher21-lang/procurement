import React, { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { Link } from 'react-router-dom'
import { User, ShoppingBag, Heart, Settings, LogOut } from 'lucide-react'

const Account = () => {
  const { user, logout } = useUser()
  const [activeTab, setActiveTab] = useState('dashboard')

  const orders = [
    { id: 'ORD-12345', date: 'Nov 05, 2026', total: 89.98, status: 'Delivered', items: 2 },
    { id: 'ORD-12346', date: 'Nov 03, 2026', total: 49.99, status: 'Delivered', items: 1 },
    { id: 'ORD-12347', date: 'Oct 28, 2026', total: 129.97, status: 'Shipped', items: 3 },
    { id: 'ORD-12348', date: 'Oct 15, 2026', total: 69.99, status: 'Delivered', items: 1 },
  ]

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-md">
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User size={40} className="text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
            <p className="text-gray-600 mb-8">
              Sign in to access your account, track orders, and manage your wishlist.
            </p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-center mb-6 pb-6 border-b">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <h2 className="font-semibold">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User size={20} />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ShoppingBag size={20} />
                  My Orders
                </button>
                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === 'wishlist' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Heart size={20} />
                  Wishlist
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings size={20} />
                  Settings
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'dashboard' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">Account Dashboard</h2>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{orders.length}</div>
                    <div className="text-gray-600">Total Orders</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">$349.93</div>
                    <div className="text-gray-600">Total Spent</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">12</div>
                    <div className="text-gray-600">Items Saved</div>
                  </div>
                </div>
                <h3 className="font-semibold mb-4">Recent Orders</h3>
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{order.id}</div>
                        <div className="text-sm text-gray-500">{order.date} • {order.items} items</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {order.status}
                        </span>
                        <span className="font-semibold">${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link to="/orders" className="text-blue-600 hover:text-blue-700">
                    View All Orders →
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">My Orders</h2>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg overflow-hidden">
                      <div className="p-4 flex items-center justify-between bg-gray-50">
                        <div>
                          <div className="font-medium">{order.id}</div>
                          <div className="text-sm text-gray-500">{order.date}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        {order.items > 1 ? (
                          <div className="space-y-2">
                            {[1, 2].map((i) => (
                              <div key={i} className="flex gap-3 text-sm">
                                <div className="w-10 h-10 bg-gray-100 rounded" />
                                <div className="flex-1">
                                  <div className="font-medium">Product {i}</div>
                                  <div className="text-gray-500">Qty: 1</div>
                                </div>
                                <div className="font-medium">${(order.total / order.items).toFixed(2)}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex gap-3 text-sm">
                            <div className="w-10 h-10 bg-gray-100 rounded" />
                            <div className="flex-1">
                              <div className="font-medium">Premium Cotton T-Shirt</div>
                              <div className="text-gray-500">Qty: 1</div>
                            </div>
                            <div className="font-medium">${order.total.toFixed(2)}</div>
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-3 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Total: <span className="font-semibold">${order.total.toFixed(2)}</span>
                        </div>
                        <Link
                          to="/order-tracking"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Track Order
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">My Wishlist</h2>
                <p className="text-gray-500 text-center py-8">Wishlist items will appear here.</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">Account Settings</h2>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <input
                        type="text"
                        defaultValue={user.name.split(' ')[0]}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <input
                        type="text"
                        defaultValue={user.name.split(' ')[1]}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      defaultValue="+971 50 123 4567"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <textarea
                      defaultValue="123 Main St, Dubai, UAE"
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      type="button"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Account
