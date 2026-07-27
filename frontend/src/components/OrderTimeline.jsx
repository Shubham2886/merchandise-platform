const STAGE_LABELS = {
  ORDER_PLACED: "Order Placed",
  PAYMENT_VERIFIED: "Payment Verified",
  DESIGN_APPROVED: "Design Approved",
  PRINTING_IN_PROGRESS: "Printing In Progress",
  QUALITY_CHECK: "Quality Check",
  PACKED: "Packed",
  SHIPMENT_CREATED: "Shipment Created",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

const STAGES = Object.keys(STAGE_LABELS);

export default function OrderTimeline({ status, timeline = [] }) {
  const isCancelled = status === "CANCELLED";
  const currentIndex = STAGES.indexOf(status);
  const timelineMap = Object.fromEntries(timeline.map((t) => [t.status, t.at]));

  if (isCancelled) {
    return (
      <div className="card p-4 border-red-200 bg-red-50">
        <p className="font-semibold text-red-700">Order Cancelled</p>
        {timelineMap.CANCELLED && (
          <p className="text-xs text-red-600 mt-1">{new Date(timelineMap.CANCELLED).toLocaleString()}</p>
        )}
      </div>
    );
  }

  return (
    <ol className="space-y-0">
      {STAGES.map((stage, idx) => {
        const done = idx <= currentIndex;
        const at = timelineMap[stage];
        return (
          <li key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  done ? "bg-indigo-900 text-white" : "bg-slate-200 text-slate-400"
                }`}
              >
                {done ? "✓" : ""}
              </div>
              {idx < STAGES.length - 1 && <div className={`w-0.5 flex-1 min-h-[24px] ${done ? "bg-indigo-900" : "bg-slate-200"}`} />}
            </div>
            <div className="pb-6">
              <p className={`text-sm font-medium ${done ? "text-slate-900" : "text-slate-400"}`}>{STAGE_LABELS[stage]}</p>
              {at && <p className="text-xs text-slate-500">{new Date(at).toLocaleString()}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export { STAGES, STAGE_LABELS };
