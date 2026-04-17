/**
 * Order State Machine — Database-as-State-Store Pattern
 * =====================================================
 * Pure functions that validate state transitions.
 * No XState — the database IS the state store.
 * BullMQ workers read status, validate transition, execute side effect,
 * and write new status atomically in a Prisma transaction.
 *
 * MarketplaceOrder lifecycle:
 *   PLACED → SPLIT → (per VendorOrder lifecycle) → SETTLED / CANCELLED
 *
 * VendorOrder lifecycle:
 *   PLACED → VENDOR_ACCEPT → GENERATE_LABEL → SHIPPED → IN_TRANSIT → DELIVERED → SETTLED
 *                ↘ VENDOR_REJECTED → CANCELLED
 *                ↘ FRAUD_HOLD → (VENDOR_ACCEPT or CANCELLED)
 *
 * Any state → RETURN_INITIATED → RETURN_RECEIVED → RETURN_COMPLETED
 */

export type MarketplaceOrderStatus =
  | "PLACED" | "SPLIT" | "VENDOR_ACCEPT" | "FRAUD_HOLD" | "VENDOR_REJECTED"
  | "GENERATE_LABEL" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "SETTLED"
  | "CANCELLED" | "RETURN_INITIATED" | "RETURN_RECEIVED" | "RETURN_COMPLETED";

export type VendorOrderStatus = MarketplaceOrderStatus;

// ============================================================
// Allowed Transitions
// ============================================================

const VENDOR_ORDER_TRANSITIONS: Record<VendorOrderStatus, VendorOrderStatus[]> = {
  PLACED: ["VENDOR_ACCEPT", "VENDOR_REJECTED", "FRAUD_HOLD", "CANCELLED"],
  FRAUD_HOLD: ["VENDOR_ACCEPT", "CANCELLED"],
  VENDOR_ACCEPT: ["GENERATE_LABEL", "CANCELLED"],
  VENDOR_REJECTED: ["CANCELLED"],
  GENERATE_LABEL: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED", "RETURN_INITIATED"],
  DELIVERED: ["SETTLED", "RETURN_INITIATED"],
  SETTLED: [],
  CANCELLED: [],
  RETURN_INITIATED: ["RETURN_RECEIVED"],
  RETURN_RECEIVED: ["RETURN_COMPLETED"],
  RETURN_COMPLETED: [],
  SPLIT: [], // Not used at VendorOrder level
};

const MARKETPLACE_ORDER_TRANSITIONS: Record<MarketplaceOrderStatus, MarketplaceOrderStatus[]> = {
  PLACED: ["SPLIT", "CANCELLED"],
  SPLIT: ["VENDOR_ACCEPT", "FRAUD_HOLD", "CANCELLED"],
  FRAUD_HOLD: ["SPLIT", "CANCELLED"],
  VENDOR_ACCEPT: ["SHIPPED"],
  VENDOR_REJECTED: ["CANCELLED"],
  GENERATE_LABEL: ["SHIPPED"],
  SHIPPED: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: ["SETTLED", "RETURN_INITIATED"],
  SETTLED: [],
  CANCELLED: [],
  RETURN_INITIATED: ["RETURN_RECEIVED"],
  RETURN_RECEIVED: ["RETURN_COMPLETED"],
  RETURN_COMPLETED: [],
};

// ============================================================
// Validation Functions
// ============================================================

export interface TransitionResult {
  valid: boolean;
  from: string;
  to: string;
  error?: string;
  allowedTransitions?: string[];
}

export function validateVendorOrderTransition(
  currentStatus: VendorOrderStatus,
  targetStatus: VendorOrderStatus
): TransitionResult {
  const allowed = VENDOR_ORDER_TRANSITIONS[currentStatus];

  if (!allowed) {
    return {
      valid: false,
      from: currentStatus,
      to: targetStatus,
      error: `Unknown status: ${currentStatus}`,
    };
  }

  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      from: currentStatus,
      to: targetStatus,
      error: `Illegal transition: ${currentStatus} → ${targetStatus}`,
      allowedTransitions: allowed,
    };
  }

  return { valid: true, from: currentStatus, to: targetStatus };
}

export function validateMarketplaceOrderTransition(
  currentStatus: MarketplaceOrderStatus,
  targetStatus: MarketplaceOrderStatus
): TransitionResult {
  const allowed = MARKETPLACE_ORDER_TRANSITIONS[currentStatus];

  if (!allowed) {
    return {
      valid: false,
      from: currentStatus,
      to: targetStatus,
      error: `Unknown status: ${currentStatus}`,
    };
  }

  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      from: currentStatus,
      to: targetStatus,
      error: `Illegal transition: ${currentStatus} → ${targetStatus}`,
      allowedTransitions: allowed,
    };
  }

  return { valid: true, from: currentStatus, to: targetStatus };
}

/**
 * Derives the aggregate MarketplaceOrder status from its VendorOrders.
 * The marketplace order status is the "lowest" status across all vendor orders.
 */
export function deriveMarketplaceOrderStatus(
  vendorOrderStatuses: VendorOrderStatus[]
): MarketplaceOrderStatus {
  if (vendorOrderStatuses.length === 0) return "PLACED";

  const allCancelled = vendorOrderStatuses.every((s) => s === "CANCELLED");
  if (allCancelled) return "CANCELLED";

  const allSettled = vendorOrderStatuses.every((s) => s === "SETTLED" || s === "CANCELLED");
  if (allSettled) return "SETTLED";

  const allDelivered = vendorOrderStatuses.every(
    (s) => s === "DELIVERED" || s === "SETTLED" || s === "CANCELLED"
  );
  if (allDelivered) return "DELIVERED";

  const anyShipped = vendorOrderStatuses.some(
    (s) => s === "SHIPPED" || s === "IN_TRANSIT" || s === "DELIVERED" || s === "SETTLED"
  );
  if (anyShipped) return "IN_TRANSIT";

  const anyAccepted = vendorOrderStatuses.some(
    (s) => s === "VENDOR_ACCEPT" || s === "GENERATE_LABEL"
  );
  if (anyAccepted) return "VENDOR_ACCEPT";

  const anyFraudHold = vendorOrderStatuses.some((s) => s === "FRAUD_HOLD");
  if (anyFraudHold) return "FRAUD_HOLD";

  return "PLACED";
}
