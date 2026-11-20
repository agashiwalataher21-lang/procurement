import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './contexts/WishlistContext'
import { UserProvider } from './contexts/UserContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderTracking from './pages/OrderTracking'
import Wishlist from './pages/Wishlist'
import Account from './pages/Account'
import CategoryPage from './pages/CategoryPage'
import Login from './pages/Login'
import Register from './pages/Register'

// Redirect unknown routes to home
const NotFound = () => {
  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-8">Page not found</p>
        <a href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          Go Home
        </a>
      </div>
    </div>
  )
}

function App() {
  return (
    <UserProvider>
      <WishlistProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-tracking" element={<OrderTracking />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/category/:category" element={<CategoryPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </CartProvider>
      </WishlistProvider>
    </UserProvider>
  )
}

export default App
