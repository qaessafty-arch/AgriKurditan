import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { dateLabel, money } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";
import { ActionButton } from "@/components/account/AccountActions";
import { PatchForm } from "@/components/admin/PatchForm";
import { uploadUrl } from "@/lib/storage";

export default async function AdminPayments() {
  await requirePageCapability("admin:commerce", "/admin/payments");
  const payments = await db.payment.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200, include: { order: { include: { user: { select: { name: true, email: true } } } }, verifiedBy: { select: { name: true } } } });
  return (
    <div>
      <h1 className="text-display-md text-ink">Payments</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">Verify each payment against your bank statement or receipt book before approving. Approving marks the order paid and activates any plan.</p>
      <ul className="mt-6 space-y-4">
        {payments.map((p) => {
          const mismatch = Number(p.amount) !== Number(p.order.amount) || p.currency !== p.order.currency;
          return (
            <li key={p.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-xs text-muted">{p.order.reference} · submitted {dateLabel(p.createdAt, true)}</p><StatusBadge status={p.status} /></div>
              <p className="mt-2 text-ink">{p.order.itemName} · {p.order.user.name} ({p.order.user.email})</p>
              <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                <div><dt className="text-muted">Declared</dt><dd>{money(p.amount, p.currency)}</dd></div>
                <div><dt className="text-muted">Order total</dt><dd>{money(p.order.amount, p.order.currency)}</dd></div>
                <div><dt className="text-muted">Reference</dt><dd className="font-mono">{p.reference}</dd></div>
                <div><dt className="text-muted">Payer</dt><dd>{p.payerName ?? "—"}</dd></div>
              </dl>
              {mismatch && <p className="mt-2 text-sm text-danger">The declared amount does not match the order total.</p>}
              {p.proofUploadId && <a href={uploadUrl(p.proofUploadId)!} target="_blank" className="mt-2 inline-block text-sm text-accent-ink hover:underline">View receipt</a>}
              {p.status === "SUBMITTED" ? (
                <div className="mt-4 flex flex-wrap items-end gap-4 border-t hairline pt-4">
                  <ActionButton url={`/api/admin/payments/${p.id}`} method="PATCH" body={{ decision: "verify" }} label="Verify and mark paid" variant="primary" confirm={`Confirm that ${money(p.amount, p.currency)} was received with reference ${p.reference}?`} />
                  <PatchForm compact url={`/api/admin/payments/${p.id}`} submitLabel="Reject" extra={{ decision: "reject" }} fields={[{ name: "reason", label: "Reason (sent to customer)", type: "text" }]} />
                </div>
              ) : <p className="mt-3 text-xs text-muted">{p.status === "VERIFIED" ? "Verified" : "Rejected"} by {p.verifiedBy?.name ?? "—"} {p.verifiedAt && `on ${dateLabel(p.verifiedAt, true)}`}{p.rejectReason && `: ${p.rejectReason}`}</p>}
            </li>
          );
        })}
        {payments.length === 0 && <p className="text-muted">No payments submitted yet.</p>}
      </ul>
    </div>
  );
}
