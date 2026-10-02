import { Router } from "express";
import { addFavorite, removeFavorite, listFavorites } from "../controllers/favoriteController";
import { protect, authorize } from "../middleware/auth";

const router = Router();
router.get("/", protect, authorize("CUSTOMER"), listFavorites);
router.post("/:providerId", protect, authorize("CUSTOMER"), addFavorite);
router.delete("/:providerId", protect, authorize("CUSTOMER"), removeFavorite);

export default router;
