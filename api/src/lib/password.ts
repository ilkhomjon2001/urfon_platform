import { hash, verify } from "@node-rs/argon2";
import { randomInt } from "node:crypto";

// argon2id, OWASP tavsiyasi (m=19 MiB, t=2, p=1)
const opts = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const hashPassword = (plain: string) => hash(plain, opts);

export async function verifyPassword(hashStr: string, plain: string) {
  try {
    return await verify(hashStr, plain);
  } catch {
    return false;
  }
}

// Admin yangi akkaunt ochganda beriladigan vaqtinchalik parol (chalkash belgilarsiz)
export function tempPassword(len = 8) {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[randomInt(alphabet.length)];
  return s;
}

export const passwordRule = { min: 8, message: "Parol kamida 8 belgidan iborat boʻlsin" };
