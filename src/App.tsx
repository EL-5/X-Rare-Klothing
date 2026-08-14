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

import { Home } from '@/pages/Home';
import { Shop } from '@/pages/Shop';
import { Collections } from '@/pages/Collections';
import { About } from '@/pages/About';
import { FAQ } from '@/pages/FAQ';
import { Contact } from '@/pages/Contact';
import { ProductDetail } from '@/pages/ProductDetail';
import { SearchResults } from '@/pages/SearchResults';
import { Checkout } from '@/pages/Checkout';
import { CheckoutVerify } from '@/pages/CheckoutVerify';
import { CheckoutSuccess } from '@/pages/CheckoutSuccess';
import { CheckoutCancel } from '@/pages/CheckoutCancel';
import { NotFound } from '@/pages/NotFound';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import { AuthCallback } from '@/pages/auth/AuthCallback';

import { AccountOverview } from '@/pages/account/AccountOverview';
import { Profile } from '@/pages/account/Profile';
import { Orders } from '@/pages/account/Orders';
import { OrderDetail } from '@/pages/account/OrderDetail';
import { Addresses } from '@/pages/account/Addresses';
import { Wishlist } from '@/pages/account/Wishlist';
import { Settings } from '@/pages/account/Settings';

import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminProducts } from '@/pages/admin/AdminProducts';
import { AdminProductDetail } from '@/pages/admin/AdminProductDetail';
import { AdminCollections } from '@/pages/admin/AdminCollections';
import { AdminCollectionDetail } from '@/pages/admin/AdminCollectionDetail';
import { AdminCategories } from '@/pages/admin/AdminCategories';
import { AdminInventory } from '@/pages/admin/AdminInventory';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminOrderDetail } from '@/pages/admin/AdminOrderDetail';
import { AdminCustomers } from '@/pages/admin/AdminCustomers';
import { AdminCustomerDetail } from '@/pages/admin/AdminCustomerDetail';
import { AdminDiscounts } from '@/pages/admin/AdminDiscounts';
import { AdminReviews } from '@/pages/admin/AdminReviews';
import { AdminContent } from '@/pages/admin/AdminContent';
import { AdminAnalytics } from '@/pages/admin/AdminAnalytics';
import { AdminSettings } from '@/pages/admin/AdminSettings';
import { AdminUsers } from '@/pages/admin/AdminUsers';

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
