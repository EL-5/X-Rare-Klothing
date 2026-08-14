import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { AccountLayout } from '@/layouts/AccountLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AuthProvider } from '@/stores/AuthStore';
import { ToastProvider } from '@/stores/ToastStore';
import { Toaster } from '@/components/ui/Toast';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { RequireGuest } from '@/components/auth/RequireGuest';
import { RequireStaffRole } from '@/components/auth/RequireStaffRole';

// `Home` stays a static import — it's the most likely first paint, so it
// ships in the entry chunk instead of costing an extra round trip after
// main.js loads. Every other route is code-split: this keeps the initial
// bundle to just what a first-time storefront visitor needs, instead of
// bundling the entire 20-page admin dashboard (charts, dialogs, etc.) into
// the same chunk every customer downloads.
import { Home } from '@/pages/Home';

const Shop = lazy(() => import('@/pages/Shop').then((m) => ({ default: m.Shop })));
const Collections = lazy(() => import('@/pages/Collections').then((m) => ({ default: m.Collections })));
const About = lazy(() => import('@/pages/About').then((m) => ({ default: m.About })));
const FAQ = lazy(() => import('@/pages/FAQ').then((m) => ({ default: m.FAQ })));
const Contact = lazy(() => import('@/pages/Contact').then((m) => ({ default: m.Contact })));
const ProductDetail = lazy(() => import('@/pages/ProductDetail').then((m) => ({ default: m.ProductDetail })));
const SearchResults = lazy(() => import('@/pages/SearchResults').then((m) => ({ default: m.SearchResults })));
const Checkout = lazy(() => import('@/pages/Checkout').then((m) => ({ default: m.Checkout })));
const CheckoutVerify = lazy(() => import('@/pages/CheckoutVerify').then((m) => ({ default: m.CheckoutVerify })));
const CheckoutSuccess = lazy(() => import('@/pages/CheckoutSuccess').then((m) => ({ default: m.CheckoutSuccess })));
const CheckoutCancel = lazy(() => import('@/pages/CheckoutCancel').then((m) => ({ default: m.CheckoutCancel })));
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));
const Login = lazy(() => import('@/pages/auth/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/auth/Register').then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const AuthCallback = lazy(() => import('@/pages/auth/AuthCallback').then((m) => ({ default: m.AuthCallback })));

const AccountOverview = lazy(() => import('@/pages/account/AccountOverview').then((m) => ({ default: m.AccountOverview })));
const Profile = lazy(() => import('@/pages/account/Profile').then((m) => ({ default: m.Profile })));
const Orders = lazy(() => import('@/pages/account/Orders').then((m) => ({ default: m.Orders })));
const OrderDetail = lazy(() => import('@/pages/account/OrderDetail').then((m) => ({ default: m.OrderDetail })));
const Addresses = lazy(() => import('@/pages/account/Addresses').then((m) => ({ default: m.Addresses })));
const Wishlist = lazy(() => import('@/pages/account/Wishlist').then((m) => ({ default: m.Wishlist })));
const Settings = lazy(() => import('@/pages/account/Settings').then((m) => ({ default: m.Settings })));

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })));
const AdminProductDetail = lazy(() => import('@/pages/admin/AdminProductDetail').then((m) => ({ default: m.AdminProductDetail })));
const AdminCollections = lazy(() => import('@/pages/admin/AdminCollections').then((m) => ({ default: m.AdminCollections })));
const AdminCollectionDetail = lazy(() =>
  import('@/pages/admin/AdminCollectionDetail').then((m) => ({ default: m.AdminCollectionDetail })),
);
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories').then((m) => ({ default: m.AdminCategories })));
const AdminInventory = lazy(() => import('@/pages/admin/AdminInventory').then((m) => ({ default: m.AdminInventory })));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })));
const AdminOrderDetail = lazy(() => import('@/pages/admin/AdminOrderDetail').then((m) => ({ default: m.AdminOrderDetail })));
const AdminCustomers = lazy(() => import('@/pages/admin/AdminCustomers').then((m) => ({ default: m.AdminCustomers })));
const AdminCustomerDetail = lazy(() =>
  import('@/pages/admin/AdminCustomerDetail').then((m) => ({ default: m.AdminCustomerDetail })),
);
const AdminDiscounts = lazy(() => import('@/pages/admin/AdminDiscounts').then((m) => ({ default: m.AdminDiscounts })));
const AdminReviews = lazy(() => import('@/pages/admin/AdminReviews').then((m) => ({ default: m.AdminReviews })));
const AdminContent = lazy(() => import('@/pages/admin/AdminContent').then((m) => ({ default: m.AdminContent })));
const AdminHomepage = lazy(() => import('@/pages/admin/AdminHomepage').then((m) => ({ default: m.AdminHomepage })));
const AdminNotifications = lazy(() =>
  import('@/pages/admin/AdminNotifications').then((m) => ({ default: m.AdminNotifications })),
);
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics').then((m) => ({ default: m.AdminAnalytics })));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
          <Routes>
            <Route element={<RootLayout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop scope="shop" />} />
              <Route path="collections" element={<Collections />} />
              <Route path="collections/:slug" element={<Shop scope="collection" />} />
              <Route path="category/:slug" element={<Shop scope="category" />} />
              <Route path="products/:slug" element={<ProductDetail />} />
              <Route path="search" element={<SearchResults />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="checkout/verify" element={<CheckoutVerify />} />
              <Route path="checkout/success" element={<CheckoutSuccess />} />
              <Route path="checkout/cancel" element={<CheckoutCancel />} />
              <Route path="about" element={<About />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="contact" element={<Contact />} />

              <Route element={<RequireGuest />}>
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
              </Route>
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="auth/callback" element={<AuthCallback />} />

              <Route element={<RequireAuth />}>
                <Route path="account" element={<AccountLayout />}>
                  <Route index element={<AccountOverview />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/:id" element={<OrderDetail />} />
                  <Route path="addresses" element={<Addresses />} />
                  <Route path="wishlist" element={<Wishlist />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="admin" element={<RequireStaffRole />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />

                <Route element={<RequireStaffRole roles={['content_manager', 'admin', 'super_admin']} />}>
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/new" element={<AdminProductDetail />} />
                  <Route path="products/:id" element={<AdminProductDetail />} />
                  <Route path="collections" element={<AdminCollections />} />
                  <Route path="collections/:id" element={<AdminCollectionDetail />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="content" element={<AdminContent />} />
                  <Route path="homepage" element={<AdminHomepage />} />
                </Route>

                <Route element={<RequireStaffRole roles={['inventory_manager', 'admin', 'super_admin']} />}>
                  <Route path="inventory" element={<AdminInventory />} />
                </Route>

                <Route element={<RequireStaffRole roles={['order_manager', 'admin', 'super_admin']} />}>
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="orders/:id" element={<AdminOrderDetail />} />
                  <Route path="discounts" element={<AdminDiscounts />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                </Route>

                <Route element={<RequireStaffRole roles={['customer_support', 'order_manager', 'admin', 'super_admin']} />}>
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="customers/:id" element={<AdminCustomerDetail />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                </Route>

                <Route element={<RequireStaffRole roles={['admin', 'super_admin']} />}>
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                <Route element={<RequireStaffRole roles={['super_admin']} />}>
                  <Route path="users" element={<AdminUsers />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        <Toaster />
      </AuthProvider>
    </ToastProvider>
  );
}
