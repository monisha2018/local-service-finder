import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function generateToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as any });
}
