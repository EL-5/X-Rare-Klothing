You are now the senior engineer responsible for signing off this project.

Review the entire codebase.

Do not assume previous batches were implemented correctly.

Inspect:

Architecture
Frontend
Backend
Database
Authentication
Authorization
Admin
Products
Variants
Inventory
Collections
Search
Cart
Checkout
Payments
Orders
Customers
Wishlist
Reviews
Discounts
Shipping
Tax
Notifications
Analytics
CMS
SEO
Accessibility
Performance
Security
Deployment

Look specifically for:

Duplicate logic
Poor abstractions
Security vulnerabilities
Race conditions
Incorrect database relationships
Missing indexes
Missing RLS policies
Incorrect authorization
Client-side trust issues
Payment vulnerabilities
Inventory inconsistencies
Poor error handling
Memory leaks
Unnecessary dependencies
Large bundles
Broken mobile UX
Accessibility problems
SEO problems

Run:

npm run lint
npm run typecheck
npm run build

Then produce:

/docs/final-architecture-review.md

Classify findings:

CRITICAL
HIGH
MEDIUM
LOW
OPTIONAL

Fix CRITICAL and HIGH issues.

After fixing, run the full test suite again.

The project is only considered complete when:

- Storefront works
- Admin works
- Database works
- Authentication works
- Cart works
- Checkout works
- Payments work in sandbox
- Orders work
- Inventory works
- RLS works
- Responsive layouts work
- Accessibility is acceptable
- SEO is implemented
- Production build succeeds
- No critical security issues remain