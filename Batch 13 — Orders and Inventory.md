Implement the complete order management system.

## CUSTOMER

Customer can:

View orders
View order details
View payment status
View shipping status
View purchased products
View totals

## ADMIN

Admin can:

View orders
Search orders
Filter orders
Open order
Change status
View customer
View payment
View items
View shipping
Add internal notes
Process refund where supported

## INVENTORY

Ensure order lifecycle interacts correctly with inventory.

Example:

Order created
→ inventory reserved

Payment successful
→ reservation finalized

Payment failed
→ reservation released

Cancellation
→ stock restored where appropriate

Return
→ stock restored according to return policy

Create transaction-safe operations.

Do not allow race conditions to oversell inventory.

Test concurrent purchasing scenarios.