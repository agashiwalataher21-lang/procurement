# Aura Fakhrie E-Commerce Application

## Overview

A full-stack e-commerce application built with React, featuring a comprehensive shopping experience for Aura Fakhrie Center L.L.C. The application includes all essential e-commerce features including product catalog, user authentication, shopping cart, wishlist, order tracking, and more.

## Key Features

- **Complete Product Catalog**: 150+ clothing, garments, and baby products
- **User Accounts**: Registration, login, and profile management
- **Shopping Cart**: Real-time cart management with quantity controls
- **Wishlist**: Save favorite products for later purchase
- **Product Reviews**: Customer ratings and product reviews
- **Advanced Search**: Smart search with filtering by category, price, size, and color
- **Order Tracking**: Real-time order status updates
- **Bank Transfer Payments**: Secure payment processing
- **Amazon-style Marketplace**: Responsive design with featured products, best sellers, and recommendations
- **Mobile Responsive**: Optimized for all devices (desktop, tablet, mobile)
- **Shopping Cart Persistence**: Local storage for cart data
- **Wishlist Persistence**: Local storage for wishlist items
- **Quick View Product Details**: Smooth navigation through product pages
- **Price Filtering**: Range-based price filtering
- **Product Comparisons**: Compare multiple products side by side

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons
- **State Management**: React Context API and Zustand
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS with custom configurations
- **Animation**: Framer Motion for smooth transitions
- **Development**: Vite for fast development

## Application Structure

The application is organized into the following components:

### Core Components

#### Contexts (State Management)
- `contexts/CartContext.jsx` - Shopping cart functionality
- `contexts/WishlistContext.jsx` - Wishlist management
- `contexts/UserContext.jsx` - User authentication

#### UI Components
- `components/Navbar.jsx` - Responsive navigation bar
- `components/Footer.jsx` - Website footer

#### Pages
- `pages/Home.jsx` - Main landing page with featured products
- `pages/Shop.jsx` - Full product catalog with filtering
- `pages/ProductDetails.jsx` - Individual product pages
- `pages/Cart.jsx` - Shopping cart management
- `pages/Checkout.jsx` - Checkout process with payment
- `pages/OrderTracking.jsx` - Order status tracking
- `pages/Wishlist.jsx` - User wishlist
- `pages/Account.jsx` - User account dashboard
- `pages/CategoryPage.jsx` - Category-specific product listings

### Configuration Files

- `package.json` - Project dependencies and scripts
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

## Project Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Navigate to project directory
# npm install
# npm run dev
```

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm preview` | Preview production build |

## Features Details

### Shopping Cart
- Add products with quantity control
- Real-time price calculations
- Free shipping over $50
- Coupon code support
- Secure checkout process

### Wishlist
- Save favorite products
- Quick move to cart
- Cross-device synchronization

### Product Reviews
- Star ratings system
- Verified purchase reviews
- Product comparison feature

### Search & Filtering
- Keyword search
- Category filtering (Men, Women, Baby, Accessories, Footwear)
- Price range filtering
- Size and color filtering
- Advanced filters panel

### Order Tracking
- Real-time order status updates
- Tracking number integration
- Timeline visualization

### User Authentication
- Registration and login
- Account dashboard
- Order history
- Profile management

## Design & Layout

### Amazon-Style Marketplace
- Clean, minimalist interface
- Product grids with hover effects
- Featured products section
- Best sellers carousel
- New arrivals showcase
- "Customers Also Bought" recommendations

### Responsive Design
- Desktop: 4 products per row
- Tablet: 3 products per row
- Mobile: 2 products per row
- Touch-friendly interfaces

### Visual Elements
- Modern color scheme (blue, orange, gray tones)
- Product card hover effects
- Smooth transitions
- Accessibility support

## API Integration (Future Ready)

The application is structured for easy API integration:

```javascript
// Example API structure
const api = {
  products: '/api/products',
  cart: '/api/cart',
  orders: '/api/orders',
  auth: '/api/auth',
  payments: '/api/payments'
}
```

## Security Features

- Local storage for sensitive data
- Secure checkout process
- Input validation
- Responsive error handling

## Future Enhancements

The application can be extended with:

1. **Payment Gateway Integration**: Add Stripe, PayPal, or other payment processors
2. **Admin Dashboard**: Manage products, orders, and users
3. **Advanced Analytics**: Sales tracking and insights
4. **Mobile App**: Native iOS and Android applications
5. **Multi-vendor Support**: Allow multiple vendors to sell on the platform
6. **Automated Marketing**: Email campaigns and customer segmentation

## Project Status

Currently in active development with core features implemented. The application provides a solid foundation for an e-commerce platform with Aura Fakhrie Center L.L.C.

## Support

For technical support or questions, please contact the development team.

---

*Application developed by Aura Fakhrie Center L.L.C. - Modern E-Commerce Solution*