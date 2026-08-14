Implement:

Discounts
Coupons
Shipping
Tax

## DISCOUNTS

Support:

Percentage
Fixed amount
Product-specific
Collection-specific
Minimum order
Maximum discount
Start/end dates
Usage limits
Per-customer limits

All discount validation must happen server-side.

## SHIPPING

Create:

Shipping zones
Shipping methods
Shipping rates

Initial zones can include:

Accra
Tema
Other Ghana
International

Keep the architecture extensible.

## TAX

Create a TaxService.

Do not hard-code tax calculations inside UI components.

Persist tax applied to historical orders.

## CHECKOUT

Integrate:

Discount
Shipping
Tax

into final totals.

Test edge cases thoroughly.