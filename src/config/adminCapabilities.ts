import type { AdminRole } from '@/types/domain';

/**
 * Human-readable description of what each role can/cannot do — for the
 * admin dashboard's "what can I do" summary only. This is documentation,
 * not enforcement: the real boundary is the RLS policies in
 * supabase/migrations/0014_rls_policies.sql (see docs/authorization.md).
 */
export const ADMIN_CAPABILITIES: Record<AdminRole, { can: string[]; cannot: string[] }> = {
  super_admin: {
    can: ['Everything — full operational and administrative access, including granting/revoking staff roles.'],
    cannot: [],
  },
  admin: {
    can: [
      'Manage products, inventory, orders, discounts, content, and store settings.',
      'View the audit log.',
    ],
    cannot: ['Grant or revoke admin roles (super_admin only).'],
  },
  inventory_manager: {
    can: ['View products', 'Manage inventory', 'View inventory movements'],
    cannot: ['Manage administrators', 'Change payment configuration', 'Manage orders or discounts'],
  },
  order_manager: {
    can: ['View and update orders', 'View payments', 'Manage discounts', 'View customer info for support'],
    cannot: ['Manage administrators', 'Change store settings', 'Write to the product catalog'],
  },
  content_manager: {
    can: ['Manage products, categories, pages, and blog posts', 'Moderate reviews'],
    cannot: ['Manage administrators', 'Manage orders, payments, or inventory levels'],
  },
  customer_support: {
    can: ['View customer profiles, addresses, and orders to assist shoppers'],
    cannot: ['Manage administrators', 'Modify the catalog, inventory, or store settings'],
  },
};
