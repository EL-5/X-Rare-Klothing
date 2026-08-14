Perform a complete security audit of the application.

Do not add features during this batch unless required to fix security problems.

Audit:

Authentication
Authorization
Supabase RLS
Admin permissions
API access
Database access
Payment webhooks
Input validation
File uploads
Image uploads
Secrets
Environment variables
XSS
CSRF where applicable
SQL injection
IDOR
Rate limiting
Session handling
Password reset
Account enumeration
Order access
Customer data
Inventory manipulation
Price manipulation
Discount manipulation
Payment manipulation

Attempt realistic attacks.

Test that a malicious customer cannot:

Change product prices
Change order totals
Apply unauthorized discounts
Access another customer's order
Access admin routes
Change their role
Modify inventory
Fake payment success
Replay payment webhooks
Upload dangerous files

Fix vulnerabilities found.

Create:

/docs/security-audit.md