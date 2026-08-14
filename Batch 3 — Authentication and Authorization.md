Implement production authentication using Supabase Auth.

## CUSTOMER AUTH

Support:

- Register
- Login
- Logout
- Email verification
- Forgot password
- Reset password
- Session persistence

## CUSTOMER ACCOUNT

Create:

/account
/account/profile
/account/orders
/account/orders/:id
/account/addresses
/account/wishlist
/account/settings

## ADMIN AUTH

Create protected admin routes.

Admin roles:

super_admin
admin
inventory_manager
order_manager
content_manager
customer_support

Implement role-based access.

Examples:

inventory_manager:

CAN:
- View products
- Manage inventory
- View inventory movements

CANNOT:
- Manage administrators
- Change payment configuration

## SECURITY

Never trust frontend roles.

Authorization must be enforced server-side/database-side.

Use Supabase RLS.

Test:

Customer A cannot access Customer B's orders.

Customer cannot access admin routes.

Inventory manager cannot access restricted settings.

Admin permissions must survive refresh.

Document:

/docs/authentication.md
/docs/authorization.md