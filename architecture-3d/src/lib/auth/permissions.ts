import type { Role } from "@prisma/client";

/**
 * Role-based capabilities. Every server route checks a capability, never a role name directly,
 * so permissions can be reasoned about (and tested) in one place.
 */
export const CAPABILITIES = {
  "designs:own": ["ADMIN", "ARCHITECT", "CUSTOMER", "PARTNER"],
  "orders:own": ["ADMIN", "ARCHITECT", "CUSTOMER", "PARTNER"],
  "reviews:write": ["ADMIN", "ARCHITECT", "CUSTOMER", "PARTNER"],
  "projects:submit": ["ADMIN", "ARCHITECT", "PARTNER"],
  "admin:access": ["ADMIN"],
  "admin:users": ["ADMIN"],
  "admin:catalog": ["ADMIN"],
  "admin:commerce": ["ADMIN"],
  "admin:leads": ["ADMIN", "ARCHITECT"],
  "admin:content": ["ADMIN"],
  "admin:settings": ["ADMIN"],
  "admin:analytics": ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Capability = keyof typeof CAPABILITIES;

export function can(role: Role | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  return (CAPABILITIES[capability] as readonly Role[]).includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  ARCHITECT: "Architect",
  CUSTOMER: "Customer",
  PARTNER: "Business partner",
};
