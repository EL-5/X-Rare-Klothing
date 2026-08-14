Using the completed audit documents, initialize the production e-commerce project.

## STACK

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router

Backend/platform:

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Row Level Security
- Supabase Edge Functions where required

Tooling:

- ESLint
- Prettier
- TypeScript strict mode

## ARCHITECTURE

Create a clean architecture:

src/
  components/
  layouts/
  pages/
  hooks/
  services/
  repositories/
  stores/
  lib/
  types/
  utils/
  config/

supabase/
  migrations/
  functions/
  seed/

docs/

Do not place business logic inside UI components.

Do not put raw Supabase queries throughout components.

## CREATE SERVICE ABSTRACTIONS

Create services/interfaces for:

ProductService
CollectionService
CartService
CustomerService
OrderService
PaymentService
InventoryService
SearchService
DiscountService
ShippingService
ReviewService
NotificationService
AnalyticsService

## GLOBAL DESIGN SYSTEM

Implement design tokens for:

- Colors
- Typography
- Spacing
- Containers
- Borders
- Radii
- Shadows
- Motion durations
- Breakpoints

Use the reference audit.

## GLOBAL COMPONENTS

Create the component architecture for:

AnnouncementBar
Header
DesktopNavigation
MobileNavigation
MegaMenu
SearchDrawer
CartDrawer
Footer
Newsletter
Modal
Drawer
Toast
Button
Input
Select
Badge
Skeleton

Do not build the full pages yet.

## QUALITY

Run:

npm install
npm run lint
npm run typecheck
npm run build

Fix all errors.

Do not proceed to the next batch until the foundation builds successfully.