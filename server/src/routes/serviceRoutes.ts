import { Router } from "express";
import { listCategories, listServices, createService, updateService, deleteService } from "../controllers/serviceController";
import { validate } from "../middleware/validate";
import { createServiceSchema } from "../utils/validators";
import { protect, authorize } from "../middleware/auth";

const router = Router();
router.get("/categories", listCategories);
router.get("/", listServices);
router.post("/", protect, authorize("PROVIDER"), validate(createServiceSchema), createService);
router.put("/:id", protect, authorize("PROVIDER"), updateService);
router.delete("/:id", protect, authorize("PROVIDER"), deleteService);

export default router;
