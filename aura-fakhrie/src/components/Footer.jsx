import React from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Clock } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">AFC</span>
              </div>
              <span className="text-xl font-bold">Aura Fakhrie</span>
            </div>
            <p className="text-gray-400 mb-4">
              Premium clothing and baby products for your family. Quality you can trust,
              style you'll love, and prices that won't break the bank.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-gray-400 hover:text-white transition">
                  Shop All
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/shipping" className="text-gray-400 hover:text-white transition">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-400 hover:text-white transition">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-gray-400 hover:text-white transition">
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="mt-1 text-blue-500" />
                <span>
                  123 Shopping Plaza<br />
                  Downtown District<br />
                  Dubai, UAE
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="text-blue-500" />
                <span>+971 50 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="text-blue-500" />
                <span>contact@aurafakhrie.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock size={20} className="text-blue-500" />
                <span>Mon-Sat: 9AM - 9PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 Aura Fakhrie Center L.L.C. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <span>Secure Checkout</span>
              <span>SSL Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
