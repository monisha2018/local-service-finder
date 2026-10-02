import { Response } from "express";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { ProviderProfile } from "../models/ProviderProfile";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middleware/auth";

 export const listConversations = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    let filter: any;

    if (req.user!.role === "PROVIDER") {
      const profile = await ProviderProfile.findOne({
        userId: req.user!.id,
      });

      if (!profile) {
        return res.json({
          success: true,
          data: [],
        });
      }

      filter = {
        providerId: profile._id,
      };
    } else {
      filter = {
        customerId: req.user!.id,
      };
    }

    const conversations = await Conversation.find(filter)
      .populate("customerId", "name profileImage")
      .populate({
        path: "providerId",
        populate: {
          path: "userId",
          select: "name profileImage",
        },
      })
      .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      data: conversations,
    });
  }
);

export const getMessages = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const conversation = await Conversation.findById(
      req.params.conversationId
    );

    if (!conversation) {
      throw new ApiError(404, "Conversation not found.");
    }

    await assertParticipant(req, conversation);

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: messages,
    });
  }
);

export const sendMessage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { receiverId, message, bookingId } = req.body;

    const conversation = await Conversation.findById(
      req.params.conversationId
    );

    if (!conversation) {
      throw new ApiError(404, "Conversation not found.");
    }

    await assertParticipant(req, conversation);

    if (!receiverId) {
      throw new ApiError(400, "Receiver ID is required.");
    }

    if (!message || !message.trim()) {
      throw new ApiError(400, "Message cannot be empty.");
    }

    const msg = await Message.create({
      conversationId: conversation._id,
      senderId: req.user!.id,
      receiverId,
      bookingId,
      message: message.trim(),
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(201).json({
      success: true,
      data: msg,
    });
  }
);

export const startConversation = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { providerId, bookingId } = req.body;

    if (!providerId) {
      throw new ApiError(400, "Provider ID is required.");
    }

    const provider = await ProviderProfile.findById(providerId);

    if (!provider) {
      throw new ApiError(404, "Provider not found.");
    }

    // findOneAndUpdate + upsert is atomic — even if this endpoint is called twice
    // in quick succession (e.g. React re-running an effect), only ONE conversation
    // document is ever created for a given customer+provider pair.
    let conversation = await Conversation.findOneAndUpdate(
      { customerId: req.user!.id, providerId: provider._id },
      { $setOnInsert: { customerId: req.user!.id, providerId: provider._id, bookingId, lastMessageAt: new Date() } },
      { upsert: true, new: true }
    );

    conversation = await Conversation.findById(conversation._id)
      .populate("customerId", "name profileImage")
      .populate({
        path: "providerId",
        populate: {
          path: "userId",
          select: "name profileImage",
        },
      }) as any;

    res.json({
      success: true,
      data: conversation,
    });
  }
);

async function assertParticipant(
  req: AuthRequest,
  conversation: any
) {
  if (req.user!.role === "ADMIN") {
    return;
  }

  if (
    req.user!.role === "CUSTOMER" &&
    String(conversation.customerId) === req.user!.id
  ) {
    return;
  }

  if (req.user!.role === "PROVIDER") {
    const profile = await ProviderProfile.findOne({
      userId: req.user!.id,
    });

    if (
      profile &&
      String(conversation.providerId) === String(profile._id)
    ) {
      return;
    }
  }

  throw new ApiError(
    403,
    "You are not a participant in this conversation."
  );
}