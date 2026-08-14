export const ROUTES = {
  home: '/',
  shop: '/shop',
  collections: '/collections',
  collection: (slug: string) => `/collections/${slug}`,
  category: (slug: string) => `/category/${slug}`,
  product: (slug: string) => `/products/${slug}`,
  search: '/search',
  checkout: '/checkout',
  checkoutVerify: '/checkout/verify',
  checkoutSuccess: '/checkout/success',
  checkoutCancel: '/checkout/cancel',
  about: '/about',
  contact: '/contact',
  faq: '/faq',

  // Auth
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  authCallback: '/auth/callback',

  // Customer account (behind RequireAuth)
  account: '/account',
  accountProfile: '/account/profile',
  accountOrders: '/account/orders',
  accountOrder: (id: string) => `/account/orders/${id}`,
  accountAddresses: '/account/addresses',
  accountWishlist: '/account/wishlist',
  accountSettings: '/account/settings',

  // Admin (behind RequireStaffRole)
  admin: '/admin',
} as const;
