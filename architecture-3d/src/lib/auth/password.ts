import "server-only";
import bcrypt from "bcryptjs";

const COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** A real bcrypt hash of a random string, compared against when the account does not exist so
 *  login timing does not reveal which emails are registered. */
export const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5x2k1zQ3m0Ue1n3Q7b6l5f4Xn0yQx7u";
