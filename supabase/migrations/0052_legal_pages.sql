-- Seed the public legal pages the footer now links to (Privacy Policy, Terms
-- of Service, Shipping & Returns). These render at /pages/:slug via the
-- generic CMS `pages` table + PageDetail route — content here mirrors facts
-- already established elsewhere in the app (14-day return window and
-- Ghana/international shipping windows from the FAQ seed, Paystack/
-- Flutterwave as the payment providers, support@x-rare.com as the support
-- address, and the "no physical store" honesty from the Contact page).

insert into pages (slug, title, body, status, seo_title, seo_description, published_at) values
(
  'privacy-policy',
  'Privacy Policy',
  $body$This Privacy Policy explains what information X-Rare ("we", "us", "our") collects when you use x-rare.com, and how we use it. By using our site, you agree to the practices described here.

## Information We Collect
Account information: your name, email address, shipping and billing addresses, and phone number, when you create an account or place an order.

Order information: the items you purchase, order totals, and payment status. We do not store full card numbers on our servers — payments are processed directly by our payment providers, Paystack and Flutterwave.

Usage information: pages viewed, searches, and cart activity, collected through our own session-based analytics so we can understand how the site is used and fix what isn't working.

## How We Use Your Information
To process and fulfil your orders, including shipping, payment confirmation, and customer support.

To send order updates and, if you've opted in, our newsletter. You can unsubscribe from marketing emails at any time.

To improve the site, based on aggregated, non-identifying usage patterns.

## Payment Processing
Checkout payments are handled by Paystack and Flutterwave. Your card details are entered directly with them and never touch our servers.

## Cookies & Local Storage
We use cookies and browser local storage to keep your cart, wishlist, and region/currency preference between visits, and to power session-based analytics. We don't use third-party advertising trackers.

## Data Sharing
We don't sell your personal information. It's shared only with the service providers required to run the store — payment processors and shipping carriers — solely to fulfil your order.

## Your Rights
You can request access to, correction of, or deletion of your personal data at any time by contacting support@x-rare.com.

## Changes to This Policy
We may update this policy from time to time. Changes will be posted on this page.

## Contact
Questions about this policy can be sent to support@x-rare.com.$body$,
  'published',
  'Privacy Policy — X-Rare',
  'How X-Rare collects, uses, and protects your personal information.',
  now()
),
(
  'terms-of-service',
  'Terms of Service',
  $body$These Terms of Service govern your use of x-rare.com and any purchase you make through it. By using the site, you agree to these terms.

## Eligibility
You must be able to form a legally binding contract in your jurisdiction to place an order with us.

## Products & Pricing
Prices are shown at checkout in your selected currency and may change without notice. We reserve the right to limit order quantities and to refuse or cancel any order, including for suspected fraud or pricing errors.

## Orders & Payment
Payments are processed securely by Paystack and Flutterwave. An order is confirmed once payment has been successfully authorized.

## Discounts & Promotions
Discount codes are subject to their own terms — such as a minimum order value, product eligibility, or one use per customer — shown at the time the code is applied.

## Shipping, Returns & Exchanges
See our Shipping & Returns page for delivery timelines, return windows, and how exchanges work.

## Account Responsibility
You're responsible for keeping your account credentials confidential and for all activity under your account.

## Intellectual Property
All site content, branding, and product photography belong to X-Rare or its licensors and may not be reused without permission.

## Limitation of Liability
X-Rare is not liable for indirect, incidental, or consequential damages arising from your use of the site, to the fullest extent permitted by law.

## Changes to These Terms
We may revise these terms from time to time. Continued use of the site after a change means you accept the updated terms.

## Contact
Questions about these terms can be sent to support@x-rare.com.$body$,
  'published',
  'Terms of Service — X-Rare',
  'The terms that govern using x-rare.com and purchasing from X-Rare.',
  now()
),
(
  'shipping-returns',
  'Shipping & Returns',
  $body$## Shipping
Within Ghana, delivery typically takes 1–5 business days depending on your location and the shipping method chosen at checkout. International delivery typically takes 3–14 business days. Exact cost and delivery estimates are calculated at checkout based on your delivery address.

## Order Processing
Orders are processed within 1–2 business days before they're dispatched, excluding weekends and holidays.

## Tracking
You'll receive a shipping confirmation by email once your order leaves our warehouse.

## Returns
Unworn items with tags still attached can be returned within 14 days of delivery. Contact support@x-rare.com to start a return.

## Exchanges
Sizes can't be changed automatically once an order is placed. Contact us as soon as possible and we'll do what we can before it ships; otherwise it can be exchanged after delivery under our standard return policy.

## Refunds
Once your return is received and inspected, we'll issue a refund to your original payment method. Please allow a few business days for it to appear, depending on your bank or payment provider.

## Non-Returnable Items
Items marked as final sale at checkout cannot be returned or exchanged.

## Contact
Questions about an order, shipment, or return can be sent to support@x-rare.com.$body$,
  'published',
  'Shipping & Returns — X-Rare',
  'X-Rare shipping timelines, return window, and how exchanges work.',
  now()
);
