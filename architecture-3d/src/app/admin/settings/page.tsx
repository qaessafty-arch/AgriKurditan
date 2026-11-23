import { requirePageCapability } from "@/lib/auth/session";
import { getSetting } from "@/lib/settings";
import { PatchForm } from "@/components/admin/PatchForm";
import { env } from "@/lib/env";

export default async function AdminSettings() {
  await requirePageCapability("admin:settings", "/admin/settings");
  const [b, p, s] = await Promise.all([getSetting("business"), getSetting("payments"), getSetting("studio")]);
  return (
    <div className="max-w-2xl space-y-12">
      <h1 className="text-display-md text-ink">Settings</h1>
      <section>
        <h2 className="mb-1 font-display text-2xl text-ink">Business details</h2>
        <p className="mb-4 text-sm text-muted">Shown in the footer, contact page and structured data. The WhatsApp button appears once a number is set.</p>
        <PatchForm url="/api/admin/settings/business" method="PUT" fields={[
          { name: "companyName", label: "Company name", type: "text", value: b.companyName },
          { name: "email", label: "Public email", type: "email", value: b.email },
          { name: "phone", label: "Phone", type: "text", value: b.phone },
          { name: "whatsapp", label: "WhatsApp number", type: "text", value: b.whatsapp, hint: "International format, digits only, e.g. 9647501234567" },
          { name: "address", label: "Address", type: "text", value: b.address },
          { name: "hours", label: "Opening hours", type: "text", value: b.hours },
        ]} />
      </section>
      <section>
        <h2 className="mb-1 font-display text-2xl text-ink">Payments</h2>
        <p className="mb-4 text-sm text-muted">Manual payment workflow: customers see these details, submit their transfer reference, and staff verify each payment before an order is marked paid. Add an online gateway only once one has been verified for your market.</p>
        <PatchForm url="/api/admin/settings/payments" method="PUT" fields={[
          { name: "currency", label: "Reporting currency", type: "text", value: p.currency },
          { name: "bankTransferEnabled", label: "Accept bank transfers", type: "checkbox", value: p.bankTransferEnabled },
          { name: "bankName", label: "Bank name", type: "text", value: p.bankName },
          { name: "accountName", label: "Account name", type: "text", value: p.accountName },
          { name: "accountNumber", label: "Account number", type: "text", value: p.accountNumber },
          { name: "iban", label: "IBAN", type: "text", value: p.iban },
          { name: "swift", label: "SWIFT / BIC", type: "text", value: p.swift },
          { name: "instructions", label: "Transfer instructions", type: "textarea", value: p.instructions },
          { name: "cashEnabled", label: "Accept cash at the office", type: "checkbox", value: p.cashEnabled },
          { name: "cashInstructions", label: "Cash payment instructions", type: "textarea", value: p.cashInstructions },
        ]} />
      </section>
      <section>
        <h2 className="mb-4 font-display text-2xl text-ink">Design studio</h2>
        <PatchForm url="/api/admin/settings/studio" method="PUT" fields={[{ name: "freeDesignLimit", label: "Saved designs on the free plan", type: "number", value: s.freeDesignLimit }]} />
      </section>
      <section className="card p-5 text-sm">
        <h2 className="font-display text-2xl text-ink">Integrations</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
          <dt className="text-muted">AI assistant</dt><dd>{env.aiProvider === "claude" ? `Claude (${env.anthropicModel})` : "Built-in rules engine (set AI_PROVIDER=claude and ANTHROPIC_API_KEY to enable Claude)"}</dd>
          <dt className="text-muted">Email</dt><dd>{env.smtpConfigured ? "SMTP configured" : "Not configured: emails are not sent (set SMTP_* variables)"}</dd>
          <dt className="text-muted">File storage</dt><dd>{env.storageDriver === "s3" ? "S3-compatible bucket" : "Local disk (./storage)"}</dd>
        </dl>
      </section>
    </div>
  );
}
