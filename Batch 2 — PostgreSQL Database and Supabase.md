Now implement the production database architecture using Supabase PostgreSQL.

Create migrations instead of manually creating tables.

## CORE TABLES

Create:

profiles
addresses

products
product_variants
product_images
product_options
product_option_values

categories
collections
collection_products

inventory
inventory_movements

carts
cart_items

wishlists
wishlist_items

orders
order_items
order_addresses

payments
payment_transactions

discounts
discount_codes

reviews
review_images

shipping_zones
shipping_methods

tax_rates

newsletter_subscribers

pages
blog_posts

settings

audit_logs

## PRODUCT REQUIREMENTS

Products must support:

- Name
- Slug
- Description
- SKU
- Status
- Brand
- Category
- Collections
- Tags
- SEO
- Metadata

Variants must support:

- SKU
- Price
- Compare-at price
- Cost
- Size
- Color
- Material
- Weight
- Barcode
- Inventory
- Availability

## INVENTORY

Support:

- Available stock
- Reserved stock
- Low stock threshold
- Inventory adjustments
- Stock movements
- Restocking
- Returns
- Reservations
- Releases

## ORDER

Orders must preserve historical snapshots.

Do not depend on the current product price/name to reconstruct an old order.

## SECURITY

Implement Supabase Row Level Security.

Customers must only access their own:

- Profile
- Addresses
- Cart
- Orders
- Wishlist
- Reviews

Admins require appropriate roles.

## ADMIN ROLES

Support:

super_admin
admin
inventory_manager
order_manager
content_manager
customer_support

Create appropriate role/permission structures.

## AUDIT LOG

Track important administrative actions.

## SEED DATA

Create realistic development seed data for:

- Products
- Variants
- Categories
- Collections
- Inventory

Do NOT use copyrighted reference-site product images unless supplied/licensed.

Run migrations and verify the database.

Document the schema in:

/docs/database.md