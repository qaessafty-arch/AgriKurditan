export class HttpError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}
export const badRequest = (msg: string, fields?: Record<string, string>) => new HttpError(400, msg, fields);
export const unauthorized = (msg = "Please sign in to continue.") => new HttpError(401, msg);
export const forbidden = (msg = "You do not have permission to do that.") => new HttpError(403, msg);
export const notFound = (msg = "Not found.") => new HttpError(404, msg);
export const conflict = (msg: string) => new HttpError(409, msg);
export const tooMany = (msg = "Too many requests. Please wait a moment and try again.") => new HttpError(429, msg);
