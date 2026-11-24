"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, SelectInput, TextArea, TextInput, formObject, useSubmit } from "./Field";
import { api } from "@/lib/client-api";
import { Link, useI18n } from "@/i18n/client";

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
  const { m } = useI18n();
  const F = m.forms;
  return (
    <div role="status" className="card p-8">
      <p className="eyebrow">{F.received}</p>
      <h2 className="mt-2 font-display text-3xl text-ink">{title}</h2>
      <p className="mt-3 text-muted">{F.referenceIs} <span className="font-mono text-ink">{reference}</span>. {F.keepIt}</p>
      <p className="mt-2 text-sm text-muted">{emailed ? F.emailed : F.notEmailed}</p>
      {signedIn && <Link href={accountPath} className="mt-6 inline-block text-sm text-accent-ink hover:underline">{F.track} {m.common.arrow}</Link>}
    </div>
  );
}

export function ConsultationForm({ prefill, services, defaults, signedIn }: {
  prefill: Prefill; services: ServiceOpt[]; signedIn: boolean;
  defaults: { service?: string; topic?: string; designId?: string; designName?: string; briefId?: string };
}) {
  const { m } = useI18n();
  const F = m.forms;
  const { submit, busy, error, fields } = useSubmit<{ reference: string; emailed: boolean }>("/api/consultations");
  const [done, setDone] = useState<{ reference: string; emailed: boolean } | null>(null);
  if (done) return <Done title={F.consultationDone} signedIn={signedIn} accountPath="/account/consultations" {...done} />;
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
        <TextInput label={F.fullName} name="name" defaultValue={prefill.name} autoComplete="name" required error={fields.name} />
        <TextInput label={F.email} name="email" type="email" defaultValue={prefill.email} autoComplete="email" required error={fields.email} />
        <TextInput label={F.phoneWa} name="phone" type="tel" defaultValue={prefill.phone ?? ""} autoComplete="tel" error={fields.phone} />
        <SelectInput label={F.service} name="serviceSlug" defaultValue={defaults.service ?? ""} options={[{ value: "", label: F.notSure }, ...services.map((s) => ({ value: s.slug, label: s.name }))]} />
      </div>
      <TextInput label={F.topic} name="topic" defaultValue={defaults.topic ?? ""} placeholder={F.topicPlaceholder} required error={fields.topic} />
      <TextArea label={F.about} name="message" required minLength={10} error={fields.message} hint={F.aboutHint} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput label={F.preferredDate} name="preferredDate" type="date" min={tomorrow} error={fields.preferredDate} />
        <SelectInput label={F.format} name="channel" options={(["video", "phone", "in_person"] as const).map((v) => ({ value: v, label: F.channels[v] }))} />
      </div>
      {defaults.designName && <p className="rounded border hairline px-3 py-2 text-sm text-muted">{F.attachedDesign} <span className="text-ink">{defaults.designName}</span></p>}
      {defaults.briefId && <p className="rounded border hairline px-3 py-2 text-sm text-muted">{F.briefShared}</p>}
      <Button type="submit" size="lg" loading={busy}>{F.requestConsultation}</Button>
      <p className="text-xs text-muted">{F.privacyNote} <Link href="/privacy" className="underline">{F.privacyLink}</Link>.</p>
    </form>
  );
}

export function QuoteForm({ prefill, services, defaults, signedIn }: {
  prefill: Prefill; services: ServiceOpt[]; signedIn: boolean;
  defaults: { service?: string; designId?: string; designName?: string; briefId?: string; details?: string };
}) {
  const { m } = useI18n();
  const F = m.forms;
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
  if (done) return <Done title={F.quoteDone} signedIn={signedIn} accountPath="/account/quotes" {...done} />;
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
        <TextInput label={F.fullName} name="name" defaultValue={prefill.name} autoComplete="name" required error={fields.name} />
        <TextInput label={F.email} name="email" type="email" defaultValue={prefill.email} autoComplete="email" required error={fields.email} />
        <TextInput label={F.phoneWa} name="phone" type="tel" defaultValue={prefill.phone ?? ""} autoComplete="tel" error={fields.phone} />
        <SelectInput label={F.service} name="serviceSlug" value={service} onChange={(e) => setService(e.target.value)} options={[{ value: "", label: F.notSure }, ...services.map((s) => ({ value: s.slug, label: s.name }))]} />
        <TextInput label={F.siteLocation} name="siteLocation" placeholder={F.cityPlaceholder} error={fields.siteLocation} />
        <TextInput label={F.area} name="areaM2" type="number" min={10} inputMode="numeric" error={fields.areaM2} />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <TextInput label={F.budgetFrom} name="budgetMin" type="number" min={0} inputMode="decimal" error={fields.budgetMin} />
        <TextInput label={F.budgetTo} name="budgetMax" type="number" min={0} inputMode="decimal" error={fields.budgetMax} />
        <SelectInput label={F.currency} name="currency" options={[{ value: "USD", label: "USD" }, { value: "IQD", label: "IQD" }, { value: "EUR", label: "EUR" }]} />
      </div>
      <TextInput label={F.timeline} name="timeline" placeholder={F.timelinePlaceholder} error={fields.timeline} />
      <TextArea label={F.details} name="details" required minLength={20} defaultValue={defaults.details} error={fields.details} hint={F.detailsHint} />
      {defaults.designName && <p className="rounded border hairline px-3 py-2 text-sm text-muted">{F.attachedStudio} <span className="text-ink">{defaults.designName}</span></p>}
      {defaults.briefId && <p className="rounded border hairline px-3 py-2 text-sm text-muted">{F.briefAttached}</p>}
      <Button type="submit" size="lg" loading={busy}>{F.sendQuote}</Button>
    </form>
  );
}

export function ContactForm({ prefill }: { prefill: Prefill }) {
  const { m } = useI18n();
  const F = m.forms;
  const { submit, busy, error, fields } = useSubmit("/api/contact");
  const [done, setDone] = useState(false);
  if (done) return <div role="status" className="card p-8"><h2 className="font-display text-3xl">{F.messageSent}</h2><p className="mt-2 text-muted">{F.replySoon}</p></div>;
  return (
    <form className="relative space-y-5" onSubmit={async (e) => { e.preventDefault(); if (await submit(formObject(e.currentTarget))) setDone(true); }}>
      <FormError message={error} />
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput label={F.fullName} name="name" defaultValue={prefill.name} required error={fields.name} />
        <TextInput label={F.email} name="email" type="email" defaultValue={prefill.email} required error={fields.email} />
      </div>
      <TextInput label={F.phone} name="phone" type="tel" defaultValue={prefill.phone ?? ""} error={fields.phone} />
      <TextInput label={F.subject} name="subject" required error={fields.subject} />
      <TextArea label={F.message} name="message" required minLength={10} error={fields.message} />
      <Button type="submit" size="lg" loading={busy}>{F.sendMessage}</Button>
    </form>
  );
}
