import { orderRepository, type AdminListOrdersParams } from '@/repositories/orderRepository';
import type { Order, OrderStatus, Paginated } from '@/types/domain';

/**
 * Order *creation* is intentionally not exposed here — there is no RLS
 * INSERT policy on `orders`/`order_items` for customers or staff; it's a
 * service-role-only path meant to run inside the checkout Edge Function
 * (see docs/database.md and docs/authorization.md). This service only
 * covers what a signed-in customer or order-staff can legitimately do
 * against Postgres directly: read, and (staff-only) update status.
 */
export interface OrderService {
  getById(id: string): Promise<Order | null>;
  listForCustomer(profileId: string): Promise<Order[]>;
  listAllForAdmin(): Promise<Order[]>;
  listForAdmin(params?: AdminListOrdersParams): Promise<Paginated<Order>>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  updateInternalNotes(id: string, internalNotes: string): Promise<Order>;
  cancel(id: string, reason?: string): Promise<Order>;
  refund(id: string, amountCents: number, restock: boolean, reason?: string): Promise<Order>;
}

class SupabaseOrderService implements OrderService {
  getById(id: string): Promise<Order | null> {
    return orderRepository.getById(id);
  }

  listForCustomer(profileId: string): Promise<Order[]> {
    return orderRepository.listByCustomer(profileId);
  }

  listAllForAdmin(): Promise<Order[]> {
    return orderRepository.listAll();
  }

  listForAdmin(params: AdminListOrdersParams = {}): Promise<Paginated<Order>> {
    return orderRepository.listForAdmin(params);
  }

  updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return orderRepository.updateStatus(id, status);
  }

  updateInternalNotes(id: string, internalNotes: string): Promise<Order> {
    return orderRepository.updateInternalNotes(id, internalNotes);
  }

  cancel(id: string, reason?: string): Promise<Order> {
    return orderRepository.cancel(id, reason);
  }

  refund(id: string, amountCents: number, restock: boolean, reason?: string): Promise<Order> {
    return orderRepository.refund(id, amountCents, restock, reason);
  }
}

export const orderService: OrderService = new SupabaseOrderService();
