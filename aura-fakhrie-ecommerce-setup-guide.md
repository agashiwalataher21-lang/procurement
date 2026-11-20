# Aura Fakhrie Center E-Commerce Setup Guide

**Complete WooCommerce Setup for WordPress**

*Generated: November 2026*

---

## Table of Contents

1. [Overview](#overview)
2. [WordPress + WooCommerce Installation](#wordpress--woocommerce-installation)
3. [Hosting Options](#hosting-options)
4. [Plugin Recommendations & Setup](#plugin-recommendations--setup)
5. [Theme Selection & Setup](#theme-selection--setup)
6. [WooCommerce Configuration](#woocommerce-configuration)
7. [Product Import Setup](#product-import-setup)
8. [Payment Gateway Setup](#payment-gateway-setup)
9. [Shipping Configuration](#shipping-configuration)
10. [Design & Layout Setup](#design--layout-setup)
11. [Performance Optimization](#performance-optimization)
12. [Launch Checklist](#launch-checklist)

---

## Overview

**Business:** Aura Fakhrie Center L.L.C  
**Products:** Clothing, garments, and baby products  
**Inventory:** 150+ items  
**Target Audience:** 20-40 years old (male & female)  
**Design Style:** Amazon-style marketplace layout

### Key Features Implemented

- User accounts & wishlists
- Product reviews & ratings
- Advanced search & filtering
- Order tracking
- Bank transfer payment integration
- Shipping charge calculation
- "Customers Also Bought" recommendations
- Recent arrivals & best sellers sections
- Category-based product organization

---

## WordPress + WooCommerce Installation

### Prerequisites

- Domain name (e.g., `aura-fakhrie.com`)
- Web hosting account (Cloudways or A2 Hosting recommended)
- PHP 8.1+ with Composer
- MySQL 5.7+ or MariaDB 10.3+
- SSL certificate (HTTPS)

### Step 1: Install WordPress

#### Option A: One-Click Installation (Recommended)

Most hosting providers offer one-click WordPress installation:

1. Log in to your hosting control panel (cPanel, Hostinger, etc.)
2. Navigate to "WordPress" or "Scripts" section
3. Click "Install Now"
4. Fill in site details:
   - **Site Name:** Aura Fakhrie Center
   - **Site Description:** Clothing & Baby Products Store
   - **Username:** Your admin username
   - **Password:** Strong password
   - **Email:** Your email address

#### Option B: Manual Installation

```bash
# Download WordPress
curl -O https://wordpress.org/latest.tar.gz

# Extract the files
tar -xzf latest.tar.gz

# Move to web root
mv wordpress/* /var/www/html/

# Set permissions
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
```

### Step 2: Configure wp-config.php

Edit `wp-config.php` with your database credentials:

```php
define('DB_NAME', 'database_name_here');
define('DB_USER', 'username_here');
define('DB_PASSWORD', 'password_here');
define('DB_HOST', 'localhost');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

// Authentication Unique Keys and Salts
define('AUTH_KEY', 'put your unique phrase here');
define('SECURE_AUTH_KEY', 'put your unique phrase here');
define('LOGGED_IN_KEY', 'put your unique phrase here');
define('NONCE_KEY', 'put your unique phrase here');
define('AUTH_SALT', 'put your unique phrase here');
define('SECURE_AUTH_SALT', 'put your unique phrase here');
define('LOGGED_IN_SALT', 'put your unique phrase here');
define('NONCE_SALT', 'put your unique phrase here');

// Disable file edits
define('DISALLOW_FILE_EDIT', true);
define('DISALLOW_FILE_MODS', true);
```

### Step 3: Complete WordPress Setup

1. Visit your domain (e.g., `http://aura-fakhrie.com`)
2. Follow WordPress installation wizard
3. Log in to admin dashboard

---

## Hosting Options

### Option 1: Cloudways (Recommended)

**Pros:**
- Managed WordPress hosting
- Free SSL certificate
- One-click WooCommerce setup
- 24/7 support
- Scalable resources

**Setup Steps:**

1. Sign up at [cloudways.com](https://www.cloudways.com)
2. Click "Add Server"
3. Choose provider (AWS, DigitalOcean, etc.)
4. Select server location near your audience
5. Choose "WordPress" stack
6. Configure server size:
   - **Start with:** 2GB RAM, 1 CPU
   - **Upgrade as needed:** 4GB+ RAM for growth
7. Name your server: "Aura Fakhrie Center"
8. Wait for deployment (~15 minutes)
9. Access your server and click "Launch WordPress"
10. Fill in site details

**Cloudways WordPress Settings:**

```
- PHP Version: 8.1
- Memory Limit: 512M
- Upload Max Size: 64M
- Execution Time: 300
```

### Option 2: A2 Hosting

**Pros:**
- Turbo servers for faster performance
- Free SSL certificate
- 99.9% uptime guarantee
- 30-day money-back guarantee

**Setup Steps:**

1. Sign up at [a2hosting.com](https://www.a2hosting.com)
2. Choose "WordPress Hosting"
3. Select plan:
   - **Startup:** Suitable for 150+ products initially
   - **Turbo Boost:** For better performance
4. Choose domain: `aura-fakhrie.com`
5. Fill in WordPress details
6. Complete purchase

**A2 Hosting Optimized Settings:**

```
- PHP Version: 8.1 (Select from dropdown)
- Memory Limit: 512M
- OpCache: Enabled
- LiteSpeed: Enabled (Turbo plans)
```

### Hosting Comparison

| Feature | Cloudways | A2 Hosting |
|---------|-----------|------------|
| Price (Start) | $11.50/mo | $2.99/mo |
| Performance | Excellent | Excellent |
| Support | 24/7 Live Chat | 24/7 Phone/Chat |
| Scalability | Easy vertical scaling | Easy plan upgrades |
| WordPress Optimization | Yes | Yes (Turbo) |
| WooCommerce Ready | Yes | Yes |

---

## Plugin Recommendations & Setup

### Essential Plugins

Install these plugins in order of priority:

### 1. WooCommerce (Core)

**Purpose:** E-commerce foundation

**Installation:**
1. Dashboard → Plugins → Add New
2. Search "WooCommerce"
3. Install & Activate
4. Run WooCommerce Setup Wizard

**Recommended Settings:**
```
WooCommerce → Settings → General:
- Store Location: [Your Country]
- Currency: [Your Currency]
- Product Sold Individually: No
- Enable Reviews: Yes
```

### 2. WP Product Review

**Purpose:** Enhanced product reviews with ratings

**Installation:**
1. Dashboard → Plugins → Add New
2. Search "WP Product Review"
3. Install & Activate

**Configuration:**
- Enable star ratings
- Allow guest reviews
- Require purchase verification

### 3. YITH WooCommerce Wishlist

**Purpose:** Wishlist functionality

**Installation:**
1. Dashboard → Plugins → Add New
2. Search "YITH WooCommerce Wishlist"
3. Install & Activate

**Configuration:**
```
YITH → Wishlist → General:
- Enable Wishlist: Yes
- Display button: Yes
- Add to cart after add to wishlist: No
- Open wishlist in new tab: No
```

### 4. SearchP rest

**Purpose:** Advanced search with filters

**Installation:**
1. Dashboard → Plugins → Add New
2. Search "SearchP rest"
3. Install & Activate

**Configuration:**
```
SearchP rest → Settings:
- Enable Facets: Yes
- Search in: Products, Categories
- Show results immediately: Yes
- Autosuggest: Yes
```

### 5. WooCommerce Order Tracking & Details

**Purpose:** Order tracking for customers

**Installation:**
1. Dashboard → Plugins → Add New
2. Search "WooCommerce Order Tracking"
3. Install & Activate

**Configuration:**
- Enable order tracking: Yes
- Show tracking on: My Account, Order Completed emails
- Default carriers: UPS, FedEx, DHL, USPS

### 6. WooCommerce Bank Transfer Payment

**Purpose:** Bank transfer payment method

**Installation:**
1. Dashboard → Plugins → Add New
2. Search "WooCommerce Bank Transfer"
3. Install & Activate

**Configuration:**
```
WooCommerce → Settings → Payments → Bank Transfer:
- Enable: Yes
- Title: Bank Transfer
- Description: Transfer funds to our bank account
- Instructions: [Your bank details]
- Email: [Your business email]
```

### 7. YITH WooCommerce Compare

**Purpose:** Product comparison feature

**Installation:**
1. Dashboard → Plugins → Add New
2. Search "YITH WooCommerce Compare"
3. Install & Activate

### 8. WooCommerce Product Add-Ons

**Purpose:** Product customization options

**Installation:**
1. Dashboard → Plugins → Add New
2. Search "WooCommerce Product Add-Ons"
3. Install & Activate

### 9. Table Rate Shipping for WooCommerce

**Purpose:** Advanced shipping rates

**Installation:**
1. Dashboard → Plugins → Add New
2. Search "Table Rate Shipping"
3. Install & Activate

### 10. WooCommerce PDF Invoices & Packing Slips

**Purpose:** Professional invoices

**Installation:**
1. Dashboard → Plugins → Add New
2. Search "WooCommerce PDF Invoices"
3. Install & Activate

### Recommended Plugin Summary

| Plugin | Purpose | Cost |
|--------|---------|------|
| WooCommerce | Core e-commerce | Free |
| WP Product Review | Enhanced reviews | Free |
| YITH Wishlist | Wishlist feature | Free |
| SearchP rest | Advanced search | Free/Premium |
| Order Tracking | Order tracking | Free |
| Bank Transfer | Bank payments | Free |
| YITH Compare | Product comparison | Free |
| Product Add-Ons | Product options | Free/Premium |
| Table Rate Shipping | Shipping rules | Free |
| PDF Invoices | Invoices | Free/Premium |

---

## Theme Selection & Setup

### Theme Options Comparison

| Theme | Price | Features | Performance |
|-------|-------|----------|-------------|
| Astra | Free/Premium | Lightweight, customizable | ⭐⭐⭐⭐⭐ |
| Kadence | Free/Premium | Modern design, builder | ⭐⭐⭐⭐⭐ |
| Flatsome | Premium | Amazon-style marketplace | ⭐⭐⭐⭐ |

### Recommended: Kadence Theme

**Why Kadence:**
- Excellent for marketplaces
- Free version is powerful
- Responsive design
- Great typography
- Compatible with all WooCommerce features

### Installation Steps

#### Step 1: Install Kadence Theme

**Option A: From WordPress Repository (Free)**

1. Dashboard → Appearance → Themes → Add New
2. Search "Kadence"
3. Click "Install" then "Activate"

**Option B: Premium Version**

1. Download Kadence Pro from [kadencewp.com](https://kadencewp.com)
2. Dashboard → Appearance → Themes → Add New → Upload Theme
3. Upload the `.zip` file
4. Activate theme

#### Step 2: Install Required Plugins

Kadence will prompt to install recommended plugins:

```
- Kadence Blocks: For advanced page building
- Kadence WooCommerce Blueprint: WooCommerce templates
- Elementor (optional): Alternative page builder
```

### Theme Configuration

#### Basic Settings

1. **Dashboard → Appearance → Customize**

```
Site Identity:
- Logo: Upload your logo
- Site Title: Aura Fakhrie Center
- Tagline: Premium Clothing & Baby Products

Colors:
- Primary: #2D3748 (Dark blue)
- Secondary: #ED8936 (Orange accent)
- Background: #FFFFFF
- Text: #2D3748

Typography:
- Headings: Poppins or Montserrat
- Body: Open Sans or Lato
```

#### Header Setup (Amazon-style)

1. **Kadence → Header Builder**
2. Configure:

```
Top Bar:
- Enable: Yes
- Text: Free shipping on orders over [amount]

Main Header:
- Logo: Left aligned
- Navigation: Center
- Search: Right (enabled)
- Cart: Right
- Account: Right
```

#### Footer Setup

```
Footer Columns: 4

Column 1 - About:
- Logo
- Business description
- Social links

Column 2 - Quick Links:
- Shop
- About Us
- Contact

Column 3 - Customer Service:
- FAQ
- Shipping Info
- Returns

Column 4 - Newsletter:
- Email subscription
```

### Landing Page Setup

#### Step 1: Create Homepage

1. **Dashboard → Pages → Add New**
2. Title: Home
3. Click "Edit with Kadence"
4. Add sections:

**Section 1: Hero Banner**

```
- Image: Full-width clothing banner
- Headline: "Premium Clothing & Baby Products"
- Sub-headline: "Quality you can trust for your family"
- CTA: "Shop Now" button
```

**Section 2: Categories**

```
Grid Layout: 3 columns

Category 1: Men's Clothing
- Icon: 👔
- Description: "Stylish men's fashion"

Category 2: Women's Clothing
- Icon: 👗
- Description: "Elegant women's wear"

Category 3: Baby Products
- Icon: 👶
- Description: "Safe & comfortable baby items"
```

**Section 3: Best Sellers**

```
Use Kadence WooCommerce Blocks:
- Block: Featured Products
- Products: Select best sellers
- Title: "Best Sellers"
```

**Section 4: Recent Arrivals**

```
Use Kadence WooCommerce Blocks:
- Block: Recent Products
- Title: "New Arrivals"
```

**Section 5: Customers Also Bought**

```
Create custom section:
- Use product recommendations
- Display cross-sells
```

**Section 6: Promotional Banner**

```
- Text: "Summer Sale - Up to 50% Off"
- Button: "View Deals"
```

#### Step 2: Set as Homepage

1. **Dashboard → Settings → Reading**
2. Front page displays: "Your latest posts" → "A static page"
3. Front page: Home
4. Posts page: Blog (create if needed)

### Menu Configuration

#### Main Navigation

1. **Dashboard → Appearance → Menus**
2. Create menu: "Main Menu"

**Menu Structure:**

```
Men
├── Clothing
│   ├── T-Shirts
│   ├── Shirts
│   └── Jeans
├── Accessories
└── Footwear

Women
├── Clothing
│   ├── Dresses
│   ├── Tops
│   └── Bottoms
├── Accessories
└── Footwear

Baby
├── Clothing
├── Feeding
├── Health & Safety
└── Toys

Pages
├── About Us
├── Contact
└── FAQ
```

---

## WooCommerce Configuration

### Step 1: Basic Settings

**Dashboard → WooCommerce → Settings**

#### General Tab

```
Store Address:
- Country/Region: [Your Country]
- Street Address: [Your address]
- City: [Your city]
- Postal Code: [Your ZIP]
- State: [Your state]

Store Location:
- Enable store location: Yes
- Store address display: Map + address

Store Address Display:
- Format: Default

Default Customer Address:
- Store base condition: Yes

Currency Options:
- Currency: [Your currency]
- Currency Position: Left
- Thousand Separator: ,
- Decimal Separator: .
- Number of Decimals: 2

Products:
- Enable reviews: Yes
- Review rating verification: Yes
- Sold individually: No
- Default product visibility: Catalog + Search

Stock Options:
- Enable stock management: Yes
- Display stock amount: Yes
- Low stock threshold: 5
- Out of stock threshold: 0

Tax Options:
- Enable taxes: No (or Yes if required)
- Prices entered with tax: No
- Calculate tax: Yes
```

#### Product Tab

```
Product Defaults:
- Downloadable: No
- Virtual: No
- Manage stock: Yes

Product Images:
- Catalog: 800x800
- Single: 600x600
- Thumbnail: 180x180

Shipping Class:
- Default: Flat Rate
```

### Step 2: Product Settings

**Dashboard → WooCommerce → Settings → Products**

#### Display Tab

```
Default Product View:
- Shop Page Display: "Show products"
- Default Category Display: "Show products"
- Subcategories Display: "Show products"

Product Pagination:
- Products per page: 24

Product Filtering:
- Enable product filtering: Yes
- Enable AJAX filtering: Yes
- Filter count: Show all

Product Reviews:
- Enable product reviews: Yes
- Review rating: Yes
- Review verification: Yes
```

#### Inventory Tab

```
Stock Display Format:
- In stock: "In stock"
- Out of stock: "Out of stock"
- Backorder: "Available on backorder"

Low Stock:
- Notify if low: Yes
- Low stock amount: 5

Out of Stock:
- Hide out of stock items: No
```

### Step 3: Order Settings

**Dashboard → WooCommerce → Settings → Orders**

```
Order Numbers:
- Order number: Sequential
- Start number: 1000

Order Status:
- Processing: "Payment received"
- On hold: "Payment pending"
- Completed: "Done"

Order Note Options:
- Show customer order note: Yes
- Allow customer to note: Yes
```

---

## Product Import Setup

### Product CSV Template

Create a `products.csv` file with the following structure:

```csv
type,sku,name,published,featured,visibility in catalog,short description,"description",regular price,sale price,stock status,stock qty,tax status,category,tags,images,dimension.length,dimension.width,dimension.height,weight,shipping_class,backorders,sold individually
simple,AF-001,Aura Premium Cotton T-Shirt,1,1,visible,"Premium cotton t-shirt for men","High quality 100% cotton t-shirt. Comfortable fit for everyday wear.","29.99,24.99,in stock,50,taxable,Men|T-Shirts|Clothing,"cotton, casual, men","https://example.com/images/af-001.jpg,https://example.com/images/af-001-2.jpg",1,1,1,0.2,standard,no,no
simple,AF-002,Women's Stylish Blouse,1,1,visible,"Elegant blouse for women","Sleeve blouse perfect for office and casual wear. Made with premium fabric.","49.99,,in stock,30,taxable,Women|Tops|Blouses,"elegant, women, office","https://example.com/images/af-002.jpg,https://example.com/images/af-002-2.jpg",1,1,1,0.15,standard,no,no
simple,AF-003,Baby Cotton Romper,1,1,visible,"Soft romper for babies","100% organic cotton romper. Gentle on baby's skin. Easy snap buttons.","19.99,,in stock,100,taxable,Baby|Clothing|Infant,"organic, baby, cotton","https://example.com/images/af-003.jpg,https://example.com/images/af-003-2.jpg",1,1,1,0.1,standard,no,no
simple,AF-004,Men's Denim Jeans,1,1,visible,"Classic denim jeans","Classic fit jeans with durable construction. Comfortable stretch fabric.","59.99,49.99,in stock,40,taxable,Men|Jeans|Bottoms,"denim, jeans, men","https://example.com/images/af-004.jpg,https://example.com/images/af-004-2.jpg",1,1,1,0.5,standard,no,no
simple,AF-005,Women's Summer Dress,1,1,visible,"Chic summer dress","Flowy dress with floral pattern. Perfect for summer occasions.","69.99,,in stock,25,taxable,Women|Dresses|Summer,"floral, summer, women","https://example.com/images/af-005.jpg,https://example.com/images/af-005-2.jpg",1,1,1,0.25,standard,no,no
simple,AF-006,Baby Diaper Bag,1,1,visible,"Organized diaper bag","Spacious diaper bag with multiple compartments. Water-resistant material.","39.99,,in stock,20,taxable,Baby|Accessories|Diapering,"diaper bag, baby, portable","https://example.com/images/af-006.jpg,https://example.com/images/af-006-2.jpg",10,8,4,1.2,standard,no,no
simple,AF-007,Men's Casual Shirt,1,1,visible,"Comfortable casual shirt","Button-down shirt for everyday wear. Wrinkle-resistant fabric.","39.99,34.99,in stock,45,taxable,Men|Shirts|Casual,"casual, men, shirt","https://example.com/images/af-007.jpg,https://example.com/images/af-007-2.jpg",1,1,1,0.3,standard,no,no
simple,AF-008,Women's Yoga Pants,1,1,visible,"Stretch yoga pants","High-waisted yoga pants with excellent stretch. Sweat-wicking fabric.","34.99,,in stock,60,taxable,Women|Leggings|Activewear,"yoga, pants, activewear","https://example.com/images/af-008.jpg,https://example.com/images/af-008-2.jpg",1,1,1,0.2,standard,no,no
simple,AF-009,Baby Soft Bath Towel,1,1,visible,"Gentle bath towel for babies","Super soft bamboo fiber towel. Absorbent and gentle on skin.","24.99,,in stock,80,taxable,Baby|Bath| towels,"bath, baby, towel","https://example.com/images/af-009.jpg,https://example.com/images/af-009-2.jpg",1,1,1,0.15,standard,no,no
simple,AF-010,Men's Running Shoes,1,1,visible,"Performance running shoes","Lightweight running shoes with cushioned sole. Breathable mesh upper.","89.99,79.99,in stock,35,taxable,Men|Footwear|Running,"running, shoes, men","https://example.com/images/af-010.jpg,https://example.com/images/af-010-2.jpg",11,7,4,0.8,standard,no,no
```

### Product Import Process

#### Method 1: WooCommerce CSV Import

1. **Dashboard → Products → Add New**
2. Click "Import" button
3. Upload your `products.csv` file
4. Map columns to WooCommerce fields
5. Click "Submit"

#### Method 2: Use "WP All Import" Plugin

For more complex imports:

1. Install "WP All Import" plugin
2. Install "WP All Import - WooCommerce Add-On"
3. Import → WooCommerce Products
4. Upload CSV file
5. Map fields
6. Import

### Product Categories Setup

Before importing, create these categories:

**Men Categories:**
```
- Men
  - Clothing
    - T-Shirts
    - Shirts
    - Jeans
    - Pants
  - Accessories
    - Belts
    - Hats
    - Watches
  - Footwear
    - Running Shoes
    - Casual Shoes
    - Boots
```

**Women Categories:**
```
- Women
  - Clothing
    - Dresses
    - Tops
    - Jeans
    - Pants
    - Shorts
  - Accessories
    - Bags
    - Jewelry
    - Scarves
  - Footwear
    - Heels
    - Flats
    - Sandals
```

**Baby Categories:**
```
- Baby
  - Clothing
    - Rompers
    - Outfits
    - Tops
    - Bottoms
  - Feeding
    - Bottles
    - Bibs
    - formula
  - Health & Safety
    - Diapers
    - Wipes
    - Skincare
  - Toys
    - Educational
    - Soft Toys
    - Outdoor
  - Gear
    - Strollers
    - Car Seats
    - Baby Monitors
```

### Product Import Checklist

- [ ] Categories created before import
- [ ] Images named consistently
- [ ] Images hosted on server or CDN
- [ ] SKU format: AF-XXX (Aura Fakhrie)
- [ ] Prices entered (regular and sale)
- [ ] Stock quantities set
- [ ] Product descriptions complete
- [ ] Product images at 800x800 minimum
- [ ] Shipping dimensions set
- [ ] Weight entered for all products

---

## Payment Gateway Setup

### Bank Transfer Payment Configuration

#### Step 1: Install Bank Transfer Plugin

**Dashboard → Plugins → Add New**
Search: "WooCommerce Bank Transfer"
Install & Activate

#### Step 2: Configure Bank Transfer Settings

**Dashboard → WooCommerce → Settings → Payments → Bank Transfer**

```
Enable Bank Transfer: Yes

Settings:
- Title: Bank Transfer
- Description: Please transfer the payment to our bank account
- Instructions:
  Transfer the total amount to the following bank account:
  
  Bank Name: [Your Bank Name]
  Account Holder: [Your Business Name]
  Account Number: [Your Account Number]
  Routing Number: [Your Routing Number]
  
  Please include your order number in the payment reference.
  We will process your order once payment is received.

- Payment Complete:
  Mark orders as: On hold
  
- Email Instructions:
  Enable email instructions: Yes
  Email instructions: [Same as above]
```

### Additional Payment Methods (Recommended)

#### Stripe Payment Gateway

1. Install "WooCommerce Stripe Payment Gateway"
2. Create Stripe account at [stripe.com](https://stripe.com)
3. Enter API keys:
   - Publishable Key
   - Secret Key
4. Enable modes:
   - Test Mode: Yes (for testing)
   - Live Mode: No (enable later)

#### PayPal Checkout

1. Install "WooCommerce PayPal Checkout"
2. Connect PayPal account
3. Configure:
   - API Credentials
   - Payment Action: Authorization
   - Invoice Number: Yes

### Payment Settings Summary

```
WooCommerce → Settings → Payments:

Active Methods:
✓ Bank Transfer
✓ Stripe
✓ PayPal

Payment Settings:
- Order Pay Timeout: 24 hours
- Force TLS 1.2: Yes
- HTTP Test Mode: No
```

---

## Shipping Configuration

### Shipping Zones Setup

#### Step 1: Create Shipping Zones

**Dashboard → WooCommerce → Settings → Shipping**

**Zone 1: Local/Within City**

```
Zone Name: Local Delivery
Zone Countries: [Your Country]
Zone Regions: [Your State/Region]

Shipping Methods:
- Flat Rate: $5.00
- Free Shipping: Minimum order $50
```

**Zone 2: National**

```
Zone Name: National Shipping
Zone Countries: [Your Country]

Shipping Methods:
- Flat Rate: $10.00
- Free Shipping: Minimum order $100
```

**Zone 3: International**

```
Zone Name: International
Zone Countries: World

Shipping Methods:
- Flat Rate: $25.00
- Free Shipping: Minimum order $200
```

### Shipping Methods Configuration

#### Flat Rate Setup

```
WooCommerce → Settings → Shipping → Flat Rate:

Enable: Yes
Title: Standard Shipping
Cost: 5
Cost per Order: No
Cost per Item: 0
```

#### Free Shipping Setup

```
WooCommerce → Settings → Shipping → Free Shipping:

Enable: Yes
Title: Free Shipping
Minimum Order Amount: 50
Enable Request: No
```

### Shipping Class Setup

**Dashboard → Products → Shipping Classes**

```
Create Shipping Classes:

1. Standard (Default)
   - Description: Standard shipping rate
   - Rate: As configured in zones

2. Express
   - Description: Express delivery service
   - Rate: +$10 to base rate

3. Heavy/Bulky
   - Description: Extra shipping fee for bulky items
   - Rate: +$15 to base rate
```

### Shipping Settings Summary

```
WooCommerce → Settings → Shipping:

Shipping Options:
- Enabled shipping methods: Flat Rate, Free Shipping
- Shipping calculator: Enabled
- Show shipping costs: Yes
- Hide shipping costs: If free shipping available

Shipping Options:
- Enable shipping calculations: Yes
- Enable free shipping: Yes
- Disable shipping when virtual: Yes

Shipping Classes:
- Default shipping class: Standard
```

### Shipping Charge Table

| Zone | Standard Shipping | Free Shipping Threshold |
|------|-------------------|------------------------|
| Local | $5.00 | $50 |
| National | $10.00 | $100 |
| International | $25.00 | $200 |

---

## Design & Layout Setup

### Amazon-Style Marketplace Layout

#### Header Configuration

**Dashboard → Appearance → Customize → Header**

```
Main Header Layout:
- Logo: Left (30% width)
- Navigation: Center (50% width)
- Search: Right (15% width)
- Cart/Account: Right (5% width)

Top Bar:
- Enable: Yes
- Text: "Free Shipping on Orders Over $50"
- Background: #ED8936 (Orange)
- Text Color: #FFFFFF
```

#### Product Grid Layout

**Dashboard → Appearance → Customize → WooCommerce → Product Grid**

```
Product Card:
- Image Aspect Ratio: 1:1
- Show Quick View: Yes
- Show Wishlist: Yes
- Show Add to Cart: Yes

Grid Settings:
- Products per row: 4 (desktop)
- Products per row: 2 (tablet)
- Products per row: 1 (mobile)
- Spacing: 20px
```

#### Recommended Sections (Homepage)

```
1. Hero Banner (Full Width)
2. Category Grid (3 columns)
3. Best Sellers (4 columns)
4. Recent Arrivals (4 columns)
5. Customers Also Bought (4 columns)
6. Promotional Banner
7. Footer (4 columns)
```

### Widget Setup

**Dashboard → Appearance → Widgets**

#### Sidebar Widgets

```
1. Search
   - Title: Search

2. Product Categories
   - Title: Shop by Category
   - Dropdown: Yes

3. Best Sellers
   - Title: Best Sellers
   - Number: 5

4. Recent Products
   - Title: New Arrivals
   - Number: 5

5. Product Tags
   - Title: Popular Tags
```

### CSS Customization

**Dashboard → Appearance → Customize → Additional CSS**

```css
/* Amazon-style product card */
.woocommerce ul.products li.product {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 15px;
    transition: box-shadow 0.3s ease;
}

.woocommerce ul.products li.product:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Product title styling */
.woocommerce ul.products li.product .woocommerce-loop-product__title {
    font-size: 16px;
    font-weight: 600;
    color: #2D3748;
    margin: 10px 0;
}

/* Price styling */
.woocommerce ul.products li.product .price {
    color: #ED8936;
    font-size: 18px;
    font-weight: 700;
}

/* Add to cart button */
.woocommerce ul.products li.product .button {
    background-color: #2D3748;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    width: 100%;
    transition: background-color 0.3s;
}

.woocommerce ul.products li.product .button:hover {
    background-color: #ED8936;
}

/* Category grid styling */
.category-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin: 40px 0;
}

.category-card {
    background: #f7f7f7;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    transition: transform 0.3s;
}

.category-card:hover {
    transform: translateY(-5px);
}

.category-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.category-title {
    font-size: 18px;
    font-weight: 600;
    margin: 15px 0 5px;
}

.category-description {
    color: #666;
    font-size: 14px;
}

/* Mobile responsive */
@media (max-width: 768px) {
    .category-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .woocommerce ul.products {
        grid-template-columns: repeat(2, 1fr) !important;
    }
}

@media (max-width: 480px) {
    .category-grid {
        grid-template-columns: 1fr;
    }
}
```

### Menu Styling

**Dashboard → Appearance → Customize → Menus**

```
Menu Locations:
- Main Menu: Primary navigation
- Footer Menu: Footer navigation
```

---

## Performance Optimization

### Caching Setup

#### Browser Caching

Add to `.htaccess` file:

```apache
# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
</IfModule>
```

#### Object Caching

Install "WP Rocket" plugin for advanced caching:

1. Install WP Rocket
2. Activate
3. Configure:
   - Enable cache: Yes
   - Lazy load: Yes
   - Combine CSS: Yes
   - Combine JavaScript: Yes
   - Defer JavaScript: Yes

### Image Optimization

1. Install "Smush" plugin
2. Bulk optimize existing images
3. Enable automatic optimization for new uploads

### Database Optimization

1. Install "WP-Optimize"
2. Run database optimization
3. Schedule automatic optimization (weekly)

### CDN Setup

#### Cloudflare CDN

1. Sign up at [cloudflare.com](https://www.cloudflare.com)
2. Add your site
3. Update nameservers
4. Enable:
   - Auto Minify
   - Brotli Compression
   - Rocket Loader
   - HTTP/2

### Hosting Optimization (Cloudways)

```
Cloudways Server Settings:

PHP Settings:
- Memory Limit: 512M
- Max Execution Time: 300
- Max Input Time: 300
- Upload Max Size: 64M

Redis Cache:
- Enable Redis: Yes
- Cache TTL: 86400

Varnish Cache:
- Enable Varnish: Yes
- Cache TTL: 3600
```

### Performance Checklist

- [ ] Enable WooCommerce product caching
- [ ] Optimize images (under 200KB each)
- [ ] Use CDN for static assets
- [ ] Enable browser caching
- [ ] Minify CSS/JavaScript
- [ ] Use lazy loading for images
- [ ] Enable object caching
- [ ] Optimize database regularly
- [ ] Use HTTP/2
- [ ] Enable GZIP compression

---

## Launch Checklist

### Pre-Launch Checklist

#### Technical

- [ ] SSL certificate installed
- [ ] Site speed tested (GTmetrix: 90+ score)
- [ ] Mobile responsive tested
- [ ] All product images loaded
- [ ] All categories created
- [ ] Payment gateways tested
- [ ] Shipping zones configured
- [ ] Order confirmation emails working
- [ ] SSL enabled on all pages

#### Content

- [ ] Homepage complete
- [ ] About page created
- [ ] Contact page created
- [ ] FAQ page created
- [ ] Privacy policy created
- [ ] Terms and conditions created
- [ ] Return policy created
- [ ] Shipping policy created

#### Testing

- [ ] Add to cart works
- [ ] Checkout process complete
- [ ] Order confirmation received
- [ ] Email notifications working
- [ ] Search function works
- [ ] Category filters work
- [ ] Wishlist functionality works
- [ ] Product reviews work
- [ ] Bank transfer payment tested

#### SEO

- [ ] Site registered with Google Search Console
- [ ] Google Analytics installed
- [ ] XML sitemap generated
- [ ] Robots.txt configured
- [ ] Meta descriptions on key pages
- [ ] Alt text on product images
- [ ] SEO-friendly product URLs

### Post-Launch

#### Week 1

- Monitor for errors
- Check order confirmations
- Verify email notifications
- Track first orders
- Address customer questions

#### Week 2

- Review product performance
- Check search terms
- Analyze user behavior
- Optimize slow-performing products

#### Ongoing

- Add new products weekly
- Update promotional banners
- Monitor inventory levels
- Respond to reviews
- Analyze sales reports

---

## Troubleshooting

### Common Issues

#### Plugin Conflicts

```
1. Deactivate all plugins
2. Activate WooCommerce
3. Activate plugins one by one
4. Test after each activation
```

#### Permission Issues

```bash
# WordPress file permissions
find /path/to/wordpress -type f -exec chmod 644 {} \;
find /path/to/wordpress -type d -exec chmod 755 {} \;
chmod 600 wp-config.php
```

#### Memory Limit Issues

Add to `wp-config.php`:
```php
define('WP_MEMORY_LIMIT', '512M');
define('WP_MAX_MEMORY_LIMIT', '1024M');
```

### Support Resources

- WooCommerce Documentation: [docs.woocommerce.com](https://docs.woocommerce.com)
- WordPress Support: [wordpress.org/support](https://wordpress.org/support)
- Cloudways Help: [help.cloudways.com](https://help.cloudways.com)
- A2 Hosting Support: [help.a2hosting.com](https://help.a2hosting.com)

---

## Quick Reference Commands

### WP-CLI Commands

```bash
# Update WordPress
wp core update

# Update plugins
wp plugin update --all

# Update WooCommerce
wp plugin update woocommerce

# Clear cache
wp cache flush

# Regenerate thumbnails
wp media regenerate

# Export products
wp export --post_type=product --dir=./backup

# Import products
wp import woocommerce-product-csv.csv --author=admin
```

### Database Backup

```bash
# Backup database
mysqldump -u username -p database_name > backup.sql

# Restore database
mysql -u username -p database_name < backup.sql
```

---

## Conclusion

This guide provides a complete setup for the Aura Fakhrie Center e-commerce website. Key takeaways:

1. **Hosting**: Choose Cloudways for managed WordPress or A2 Hosting for cost-effectiveness
2. **Plugins**: Focus on essential plugins - WooCommerce, YITH Wishlist, SearchP rest, Order Tracking
3. **Theme**: Kadence offers the best balance of features and performance
4. **Products**: Use the provided CSV template for efficient import
5. **Design**: Amazon-style layout with category grids and recommended products
6. **Payments**: Bank transfer integrated with additional options for growth

### Next Steps

1. Set up hosting account
2. Install WordPress
3. Follow plugin installation steps
4. Configure WooCommerce settings
5. Import products from CSV
6. Test all functionality
7. Launch website

**Estimated Setup Time:** 4-6 hours for initial configuration  
**Product Import Time:** 1-2 hours for 150+ products  
**Testing Time:** 2-3 hours for comprehensive testing

---

*Guide created for Aura Fakhrie Center L.L.C*  
*Last updated: November 2026*
