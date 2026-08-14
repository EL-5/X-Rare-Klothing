Build the real checkout experience.

Flow:

Cart
↓
Customer information
↓
Shipping address
↓
Shipping method
↓
Discount
↓
Order summary
↓
Payment
↓
Confirmation

Create:

/checkout
/checkout/success
/checkout/cancel

## CHECKOUT VALIDATION

Validate server-side:

Cart
Products
Variants
Inventory
Prices
Discounts
Shipping
Tax
Customer

## ORDER CREATION

Create a pending order before payment.

Preserve historical order snapshots.

Do not allow the client to modify:

Product price
Discount amount
Tax
Shipping amount

## CHECKOUT UX

Implement:

Loading
Validation errors
Payment errors
Expired checkout
Out-of-stock during checkout
Success
Failure

Make checkout mobile-first.