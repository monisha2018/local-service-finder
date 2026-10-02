import { Router } from "express";
import { register, login, logout, getMe } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "../utils/validators";
import { protect } from "../middleware/auth";

const router = Router();
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;
