Build the complete product detail page.

Route:

/products/:slug

Implement:

ProductGallery
ProductInformation
VariantSelector
ColorSelector
SizeSelector
QuantitySelector
AddToCart
PickupInformation
ProductDetails
ShippingReturns
SizeGuide
RelatedProducts
Reviews

## GALLERY

Support:

- Main image
- Thumbnails
- Previous/next
- Mobile swipe
- Keyboard
- Zoom if present in audit
- Smooth transitions

## VARIANTS

Variant selection must be functional.

Selecting:

Color
Size
Other options

must resolve to a real product variant.

Update:

Price
Availability
SKU
Image
Inventory

where appropriate.

## ADD TO CART

Add the exact selected variant.

Validate:

Product exists
Variant exists
Variant available
Quantity available

Do not trust browser-supplied prices.

## RELATED PRODUCTS

Load from the product service.

## REVIEWS

Show verified reviews where available.