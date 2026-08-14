Replace any temporary/mock cart implementation with the real commerce cart.

Support:

Guest cart
Authenticated cart

## GUEST

Persist cart securely enough for normal shopping UX.

## LOGIN

When a guest authenticates:

Merge the guest cart with the customer's existing cart.

Resolve duplicate variants correctly.

## CART

Support:

Add
Remove
Increase
Decrease
Clear
Variant changes
Subtotal
Discount
Tax estimate
Shipping estimate
Total

## IMPORTANT

Never trust:

Price
Discount
Inventory
Totals

from the browser.

Server-side/database logic must be authoritative.

Test:

Multiple products
Multiple variants
Quantity changes
Refresh
Logout
Login
Guest → customer merge
Out-of-stock item
Insufficient inventory