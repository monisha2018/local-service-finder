import { Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { ProviderProfile } from "../models/ProviderProfile";
import { generateToken } from "../utils/generateToken";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middleware/auth";

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, phone, password, role } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) throw new ApiError(409, "An account with this email or phone already exists.");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, phone, passwordHash, role: role || "CUSTOMER" });

  if (user.role === "PROVIDER") {
    await ProviderProfile.create({
      userId: user._id,
      profession: "Not specified",
      experienceYears: 0,
      categories: [],
      workingHours: [],
    });
  }

  const token = generateToken({ id: user.id, role: user.role });
  res.status(201).json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "Invalid email or password.");

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new ApiError(401, "Invalid email or password.");
  if (user.status === "SUSPENDED") throw new ApiError(403, "This account has been suspended.");

  const token = generateToken({ id: user.id, role: user.role });
  res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

export const logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully." });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id).select("-passwordHash");
  if (!user) throw new ApiError(404, "User not found.");
  res.json({ success: true, user });
});
