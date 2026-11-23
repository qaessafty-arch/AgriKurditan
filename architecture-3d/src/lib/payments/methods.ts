import type { Settings } from "@/lib/settings";

/**
 * Payment methods. Only methods an administrator has configured are offered.
 * To add an online gateway (e.g. a provider verified for the Iraqi market), implement this interface
 * with server-side verification of the provider's webhook signature before marking an order paid.
 */
export interface PaymentMethod {
  id: "bank_transfer" | "cash";
  label: string;
  available: (s: Settings<"payments">) => boolean;
  instructions: (s: Settings<"payments">) => { label: string; value: string }[];
  note: (s: Settings<"payments">) => string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "bank_transfer",
    label: "Bank transfer",
    available: (s) => s.bankTransferEnabled && Boolean(s.accountName && (s.iban || s.accountNumber)),
    instructions: (s) => [
      { label: "Bank", value: s.bankName },
      { label: "Account name", value: s.accountName },
      { label: "Account number", value: s.accountNumber },
      { label: "IBAN", value: s.iban },
      { label: "SWIFT / BIC", value: s.swift },
    ].filter((x) => x.value),
    note: (s) => s.instructions || "Use your order reference as the transfer description, then submit the transfer details below.",
  },
  {
    id: "cash",
    label: "Cash at our office",
    available: (s) => s.cashEnabled,
    instructions: () => [],
    note: (s) => s.cashInstructions || "Pay in cash at our office and keep your receipt number.",
  },
];

export function availableMethods(s: Settings<"payments">) {
  return PAYMENT_METHODS.filter((m) => m.available(s));
}
