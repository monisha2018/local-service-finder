import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User, UserRole } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export interface AuthRequest extends Request {
  user?: { id: string; role: UserRole };
}

export const protect = asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) throw new ApiError(401, "Not authenticated. Please log in.");

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { id: string; role: UserRole };
    const user = await User.findById(decoded.id).select("_id role status");
    if (!user) throw new ApiError(401, "User no longer exists.");
    if (user.status === "SUSPENDED") throw new ApiError(403, "Account suspended.");
    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired token.");
  }
});

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action.");
    }
    next();
  };
}
