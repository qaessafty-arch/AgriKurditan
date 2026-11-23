"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, SelectInput, TextArea, TextInput, formObject, useSubmit } from "./Field";
import { api } from "@/lib/client-api";

interface Prefill { name?: string; email?: string; phone?: string | null }
interface ServiceOpt { slug: string; name: string }

function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    </div>
  );
}

function Done({ title, reference, emailed, signedIn, accountPath }: { title: string; reference: string; emailed: boolean; signedIn: boolean; accountPath: string }) {
  return (
    <div role="status" className="card p-8">
      <p className="eyebrow">Received</p>
      <h2 className="mt-2 font-display text-3xl text-ink">{title}</h2>
      <p className="mt-3 text-muted">Your reference is <span className="font-mono text-ink">{reference}</span>. Keep it for any follow-up.</p>
      <p className="mt-2 text-sm text-muted">{emailed ? "A confirmation has been sent to your email." : "We could not send a confirmation email, so please note your reference. Our team has been notified."}</p>
      {signedIn && <Link href={accountPath} className="mt-6 inline-block text-sm text-accent-ink hover:underline">Track it in your account →</Link>}
    </div>
  );
}

export function ConsultationForm({ prefill, services, defaults, signedIn }: {
  prefill: Prefill; services: ServiceOpt[]; signedIn: boolean;
  defaults: { service?: string; topic?: string; designId?: string; designName?: string; briefId?: string };
}) {
  const { submit, busy, error, fields } = useSubmit<{ reference: string; emailed: boolean }>("/api/consultations");
  const [done, setDone] = useState<{ reference: string; emailed: boolean } | null>(null);
  if (done) return <Done title="Consultation requested" signedIn={signedIn} accountPath="/account/consultations" {...done} />;
  const tomorrow = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
  return (
    <form className="relative space-y-5" onSubmit={async (e) => {
      e.preventDefault();
      const f = formObject(e.currentTarget);
      const r = await submit({ ...f, preferredDate: f.preferredDate || undefined, designId: defaults.designId, briefId: defaults.briefId });
      if (r) setDone(r);
    }}>
      <FormError message={error} />
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput label="Full name" name="name" defaultValue={prefill.name} autoComplete="name" required error={fields.name} />
        <TextInput label="Email" name="email" type="email" defaultValue={prefill.email} autoComplete="email" required error={fields.email} />
        <TextInput label="Phone or WhatsApp (optional)" name="phone" type="tel" defaultValue={prefill.phone ?? ""} autoComplete="tel" error={fields.phone} />
        <SelectInput label="Service" name="serviceSlug" defaultValue={defaults.service ?? ""} options={[{ value: "", label: "Not sure yet" }, ...services.map((s) => ({ value: s.slug, label: s.name }))]} />
      </div>
      <TextInput label="Topic" name="topic" defaultValue={defaults.topic ?? ""} placeholder="e.g. New family home on a 600 m² plot" required error={fields.topic} />
      <TextArea label="Tell us about the project" name="message" required minLength={10} error={fields.message} hint="Site, size, timeline and anything you already know." />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput label="Preferred date (optional)" name="preferredDate" type="date" min={tomorrow} error={fields.preferredDate} />
        <SelectInput label="Meeting format" name="channel" options={[{ value: "video", label: "Video call" }, { value: "phone", label: "Phone call" }, { value: "in_person", label: "In person" }]} />
      </div>
      {defaults.designName && <p className="rounded border hairline px-3 py-2 text-sm text-muted">Attached design: <span className="text-ink">{defaults.designName}</span></p>}
      {defaults.briefId && <p className="rounded border hairline px-3 py-2 text-sm text-muted">Your AI-assisted brief will be shared with the architect.</p>}
      <Button type="submit" size="lg" loading={busy}>Request consultation</Button>
      <p className="text-xs text-muted">We use your details only to respond to this request. See our <Link href="/privacy" className="underline">privacy policy</Link>.</p>
    </form>
  );
}

export function QuoteForm({ prefill, services, defaults, signedIn }: {
  prefill: Prefill; services: ServiceOpt[]; signedIn: boolean;
  defaults: { service?: string; designId?: string; designName?: string; briefId?: string; details?: string };
}) {
  const { submit, busy, error, fields } = useSubmit<{ reference: string; emailed: boolean }>("/api/quotes");
  const [done, setDone] = useState<{ reference: string; emailed: boolean } | null>(null);
  const draft = useRef<{ id: string; key: string } | null>(null);
  const started = useRef(false);
  const [service, setService] = useState(defaults.service ?? "");

  const startDraft = () => {
    if (started.current) return;
    started.current = true;
    void api<{ id: string; key: string }>("/api/quotes/draft", { body: { serviceSlug: service || undefined } }).then((r) => { if (r.ok) draft.current = r.data; });
  };
  if (done) return <Done title="Quote request sent" signedIn={signedIn} accountPath="/account/quotes" {...done} />;
  return (
    <form className="relative space-y-5" onFocus={startDraft} onSubmit={async (e) => {
      e.preventDefault();
      const f = formObject(e.currentTarget);
      const r = await submit({ ...f, draftId: draft.current?.id, draftKey: draft.current?.key, designId: defaults.designId, briefId: defaults.briefId });
      if (r) setDone(r);
    }}>
      <FormError message={error} />
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput label="Full name" name="name" defaultValue={prefill.name} autoComplete="name" required error={fields.name} />
        <TextInput label="Email" name="email" type="email" defaultValue={prefill.email} autoComplete="email" required error={fields.email} />
        <TextInput label="Phone or WhatsApp (optional)" name="phone" type="tel" defaultValue={prefill.phone ?? ""} autoComplete="tel" error={fields.phone} />
        <SelectInput label="Service" name="serviceSlug" value={service} onChange={(e) => setService(e.target.value)} options={[{ value: "", label: "Not sure yet" }, ...services.map((s) => ({ value: s.slug, label: s.name }))]} />
        <TextInput label="Site location (optional)" name="siteLocation" placeholder="City or district" error={fields.siteLocation} />
        <TextInput label="Approximate floor area, m² (optional)" name="areaM2" type="number" min={10} inputMode="numeric" error={fields.areaM2} />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <TextInput label="Budget from (optional)" name="budgetMin" type="number" min={0} inputMode="decimal" error={fields.budgetMin} />
        <TextInput label="Budget to (optional)" name="budgetMax" type="number" min={0} inputMode="decimal" error={fields.budgetMax} />
        <SelectInput label="Currency" name="currency" options={[{ value: "USD", label: "USD" }, { value: "IQD", label: "IQD" }, { value: "EUR", label: "EUR" }]} />
      </div>
      <TextInput label="Timeline (optional)" name="timeline" placeholder="e.g. Start construction next spring" error={fields.timeline} />
      <TextArea label="Project details" name="details" required minLength={20} defaultValue={defaults.details} error={fields.details} hint="What do you want to build or change, and what matters most?" />
      {defaults.designName && <p className="rounded border hairline px-3 py-2 text-sm text-muted">Attached studio design: <span className="text-ink">{defaults.designName}</span></p>}
      {defaults.briefId && <p className="rounded border hairline px-3 py-2 text-sm text-muted">Your AI-assisted brief is attached.</p>}
      <Button type="submit" size="lg" loading={busy}>Send quote request</Button>
    </form>
  );
}

export function ContactForm({ prefill }: { prefill: Prefill }) {
  const { submit, busy, error, fields } = useSubmit("/api/contact");
  const [done, setDone] = useState(false);
  if (done) return <div role="status" className="card p-8"><h2 className="font-display text-3xl">Message sent</h2><p className="mt-2 text-muted">Thank you. We usually reply within one working day.</p></div>;
  return (
    <form className="relative space-y-5" onSubmit={async (e) => { e.preventDefault(); if (await submit(formObject(e.currentTarget))) setDone(true); }}>
      <FormError message={error} />
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput label="Full name" name="name" defaultValue={prefill.name} required error={fields.name} />
        <TextInput label="Email" name="email" type="email" defaultValue={prefill.email} required error={fields.email} />
      </div>
      <TextInput label="Phone (optional)" name="phone" type="tel" defaultValue={prefill.phone ?? ""} error={fields.phone} />
      <TextInput label="Subject" name="subject" required error={fields.subject} />
      <TextArea label="Message" name="message" required minLength={10} error={fields.message} />
      <Button type="submit" size="lg" loading={busy}>Send message</Button>
    </form>
  );
}
