import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { notFound } from "@/lib/errors";
import { readStoredFile } from "@/lib/storage";

/**
 * Serves stored files with authorization: public files to anyone; private files to their owner,
 * and to staff when the file is attached to a lead (land photos) or a payment (proofs).
 */
export const GET = route<{ id: string }>({}, async (_req, { params }) => {
  const upload = await db.upload.findUnique({ where: { id: params.id } });
  if (!upload) throw notFound();
  if (!upload.isPublic) {
    const user = await getCurrentUser();
    const owner = user && upload.userId === user.id;
    const staff =
      (upload.purpose === "payment_proof" && can(user?.role, "admin:commerce")) ||
      (upload.purpose !== "payment_proof" && can(user?.role, "admin:leads"));
    if (!owner && !staff) throw notFound();
  }
  const body = await readStoredFile(upload);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": upload.mime,
      "Content-Length": String(body.length),
      "Cache-Control": upload.isPublic ? "public, max-age=31536000, immutable" : "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": upload.mime === "application/pdf" ? "attachment" : "inline",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
});
