// Defines the fixed 10-stage order lifecycle and enforces that transitions
// can only move to the immediate next stage (no skipping), except for the
// explicit CANCELLED branch which is only reachable before printing starts.

const ORDER_STAGES = [
  "ORDER_PLACED",
  "PAYMENT_VERIFIED",
  "DESIGN_APPROVED",
  "PRINTING_IN_PROGRESS",
  "QUALITY_CHECK",
  "PACKED",
  "SHIPMENT_CREATED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const CANCELLED = "CANCELLED";

// Stages at/after which cancellation is no longer allowed (printing has begun)
const CANCEL_LOCK_INDEX = ORDER_STAGES.indexOf("PRINTING_IN_PROGRESS");

function canCancel(currentStatus) {
  const idx = ORDER_STAGES.indexOf(currentStatus);
  return idx !== -1 && idx < CANCEL_LOCK_INDEX;
}

// Admin transition validation: only current -> next in sequence is allowed.
// Throws a descriptive reason string on invalid transition, else returns true.
function canTransition(currentStatus, nextStatus) {
  if (currentStatus === CANCELLED) {
    return { ok: false, reason: "Order is cancelled; no further status changes allowed." };
  }
  if (nextStatus === CANCELLED) {
    return canCancel(currentStatus)
      ? { ok: true }
      : { ok: false, reason: "Order can only be cancelled before printing starts." };
  }

  const currentIdx = ORDER_STAGES.indexOf(currentStatus);
  const nextIdx = ORDER_STAGES.indexOf(nextStatus);

  if (currentIdx === -1 || nextIdx === -1) {
    return { ok: false, reason: "Unknown order status." };
  }
  if (nextIdx !== currentIdx + 1) {
    return {
      ok: false,
      reason: `Invalid transition: cannot move from ${currentStatus} to ${nextStatus}. Next allowed stage is ${
        ORDER_STAGES[currentIdx + 1] || "none (terminal stage)"
      }.`,
    };
  }
  return { ok: true };
}

module.exports = { ORDER_STAGES, CANCELLED, canCancel, canTransition };
