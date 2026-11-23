import { cn } from "@/lib/cn";
import { titleCase } from "@/lib/format";

const TONE: Record<string, string> = {
  PAID: "success", VERIFIED: "success", COMPLETED: "success", CONFIRMED: "success", ACCEPTED: "success", PUBLISHED: "success", ACTIVE: "success", QUOTED: "success",
  PENDING_PAYMENT: "warn", AWAITING_VERIFICATION: "warn", SUBMITTED: "warn", REQUESTED: "warn", IN_REVIEW: "warn", PENDING_REVIEW: "warn", DRAFT: "muted",
  CANCELLED: "danger", REJECTED: "danger", DECLINED: "danger", REFUNDED: "danger", EXPIRED: "muted", ARCHIVED: "muted",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE[status] ?? "muted";
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
      tone === "success" && "border-success/40 text-success", tone === "warn" && "border-accent/50 text-accent-ink",
      tone === "danger" && "border-danger/40 text-danger", tone === "muted" && "border-line text-muted")}>
      {titleCase(status)}
    </span>
  );
}
