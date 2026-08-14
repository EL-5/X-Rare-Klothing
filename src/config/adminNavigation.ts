import {
  LayoutDashboard,
  Package,
  Layers,
  FolderTree,
  Boxes,
  ShoppingCart,
  Users,
  Percent,
  Star,
  FileText,
  LayoutTemplate,
  BarChart3,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AdminRole } from '@/types/domain';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: AdminRole[];
  end?: boolean;
}

export const adminNavItems: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Products', href: '/admin/products', icon: Package, roles: ['content_manager', 'admin', 'super_admin'] },
  { label: 'Collections', href: '/admin/collections', icon: Layers, roles: ['content_manager', 'admin', 'super_admin'] },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree, roles: ['content_manager', 'admin', 'super_admin'] },
  { label: 'Inventory', href: '/admin/inventory', icon: Boxes, roles: ['inventory_manager', 'admin', 'super_admin'] },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart, roles: ['order_manager', 'admin', 'super_admin'] },
  { label: 'Customers', href: '/admin/customers', icon: Users, roles: ['customer_support', 'order_manager', 'admin', 'super_admin'] },
  { label: 'Discounts', href: '/admin/discounts', icon: Percent, roles: ['order_manager', 'admin', 'super_admin'] },
  { label: 'Reviews', href: '/admin/reviews', icon: Star, roles: ['content_manager', 'admin', 'super_admin'] },
  { label: 'Content', href: '/admin/content', icon: FileText, roles: ['content_manager', 'admin', 'super_admin'] },
  { label: 'Homepage', href: '/admin/homepage', icon: LayoutTemplate, roles: ['content_manager', 'admin', 'super_admin'] },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, roles: ['order_manager', 'admin', 'super_admin'] },
  { label: 'Settings', href: '/admin/settings', icon: Settings, roles: ['admin', 'super_admin'] },
  { label: 'Admins', href: '/admin/users', icon: ShieldCheck, roles: ['super_admin'] },
];

export const adminRouteLabels: Record<string, string> = {
  admin: 'Dashboard',
  products: 'Products',
  new: 'New',
  collections: 'Collections',
  categories: 'Categories',
  inventory: 'Inventory',
  orders: 'Orders',
  customers: 'Customers',
  discounts: 'Discounts',
  reviews: 'Reviews',
  content: 'Content',
  homepage: 'Homepage',
  analytics: 'Analytics',
  settings: 'Settings',
  users: 'Admins',
};
