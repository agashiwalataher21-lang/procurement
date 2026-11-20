import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useUser } from '../contexts/UserContext'
import {
  ShoppingBag,
  Heart,
  User,
  Search,
  Menu,
  X,
  ChevronDown,
  Star,
} from 'lucide-react'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  const { cartCount, setIsCartOpen } = useCart()
  const { isInWishlist, wishlist } = useWishlist()
  const { isAuthenticated, user, logout } = useUser()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const categories = [
    'Men', 'Women', 'Baby', 'Accessories', 'Footwear'
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white'
      }`}
    >
      {/* Top Bar */}
      <div className="bg-orange-500 text-white text-sm">
        <div className="container mx-auto px-4 py-2 text-center">
          Free Shipping on Orders Over $50
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AFC</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 hidden md:block">
              Aura Fakhrie
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Home
            </Link>
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-700 hover:text-blue-600 font-medium">
                Shop
                <ChevronDown size={16} />
              </button>
              <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-lg py-2 hidden group-hover:block">
                {categories.map((category) => (
                  <Link
                    key={category}
                    to={`/category/${category.toLowerCase()}`}
                    className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </div>
            <Link to="/baby" className="text-gray-700 hover:text-blue-600 font-medium">
              Baby
            </Link>
            <Link to="/account" className="text-gray-700 hover:text-blue-600 font-medium">
              Account
            </Link>
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center gap-4">
            <form onSubmit={handleSubmit} className="hidden md:block relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
              >
                <Search size={20} />
              </button>
            </form>

            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden text-gray-700"
            >
              <Menu size={24} />
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative text-gray-700 hover:text-blue-600"
            >
              <ShoppingBag size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/wishlist')}
              className="relative text-gray-700 hover:text-red-500"
            >
              <Heart size={24} />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
              >
                <User size={24} />
                {isAuthenticated && user && (
                  <span className="hidden md:block font-medium">{user.name}</span>
                )}
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                    {!isAuthenticated ? (
                      <>
                        <Link
                          to="/login"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Login
                        </Link>
                        <Link
                          to="/register"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Register
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/account"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          My Account
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          My Orders
                        </Link>
                        <button
                          onClick={() => {
                            logout()
                            setIsUserMenuOpen(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 transform transition-transform duration-300">
            <div className="p-4 flex items-center justify-between border-b">
              <span className="font-bold text-xl">Menu</span>
              <button onClick={() => setIsMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              <Link
                to="/"
                className="block px-4 py-3 rounded-lg hover:bg-blue-50 text-gray-700 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/shop"
                className="block px-4 py-3 rounded-lg hover:bg-blue-50 text-gray-700 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Shop All
              </Link>
              <div className="border-t my-2" />
              <span className="block px-4 py-2 text-gray-500 font-medium">Categories</span>
              {categories.map((category) => (
                <Link
                  key={category}
                  to={`/category/${category.toLowerCase()}`}
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category}
                </Link>
              ))}
              <div className="border-t my-2" />
              <Link
                to="/account"
                className="block px-4 py-3 rounded-lg hover:bg-blue-50 text-gray-700 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Account
              </Link>
              <Link
                to="/cart"
                className="block px-4 py-3 rounded-lg hover:bg-blue-50 text-gray-700 font-medium flex items-center justify-between"
                onClick={() => setIsMenuOpen(false)}
              >
                Cart
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {cartCount}
                </span>
              </Link>
              <Link
                to="/wishlist"
                className="block px-4 py-3 rounded-lg hover:bg-blue-50 text-gray-700 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Wishlist ({wishlist.length})
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}

export default Navbar
