import { Router } from "express";
import { listConversations, getMessages, sendMessage, startConversation } from "../controllers/chatController";
import { protect } from "../middleware/auth";

const router = Router();
router.get("/conversations", protect, listConversations);
router.post("/conversations", protect, startConversation);
router.get("/conversations/:conversationId/messages", protect, getMessages);
router.post("/conversations/:conversationId/messages", protect, sendMessage);

export default router;
