/**
 * Settlement State Machine — Database-as-State-Store Pattern
 * ==========================================================
 * Tracks the lifecycle of vendor payouts through Revolut.
 *
 * Settlement lifecycle:
 *   PENDING → PROCESSING → COMPLETED
 *                ↘ FAILED → PENDING (retry)
 *                ↘ PARTIALLY_PAID → PROCESSING (retry remainder)
 *   Any state → DISPUTED → CANCELLED or COMPLETED
 */

export type SettlementStatus =
  | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  | "PARTIALLY_PAID" | "DISPUTED" | "CANCELLED";

const SETTLEMENT_TRANSITIONS: Record<SettlementStatus, SettlementStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED", "FAILED", "PARTIALLY_PAID"],
  COMPLETED: [],
  FAILED: ["PENDING", "CANCELLED"],
  PARTIALLY_PAID: ["PROCESSING", "CANCELLED"],
  DISPUTED: ["CANCELLED", "COMPLETED"],
  CANCELLED: [],
};

export interface SettlementTransitionResult {
  valid: boolean;
  from: SettlementStatus;
  to: SettlementStatus;
  error?: string;
  allowedTransitions?: SettlementStatus[];
}

export function validateSettlementTransition(
  currentStatus: SettlementStatus,
  targetStatus: SettlementStatus
): SettlementTransitionResult {
  const allowed = SETTLEMENT_TRANSITIONS[currentStatus];

  if (!allowed) {
    return {
      valid: false,
      from: currentStatus,
      to: targetStatus,
      error: `Unknown settlement status: ${currentStatus}`,
    };
  }

  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      from: currentStatus,
      to: targetStatus,
      error: `Illegal settlement transition: ${currentStatus} → ${targetStatus}`,
      allowedTransitions: allowed,
    };
  }

  return { valid: true, from: currentStatus, to: targetStatus };
}
