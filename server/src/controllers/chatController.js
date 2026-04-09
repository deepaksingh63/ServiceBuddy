import Message from "../models/Message.js";
import Booking from "../models/Booking.js";

const clearExpiredMessages = async (bookingId) => {
  await Message.deleteMany({
    bookingId,
    expiresAt: { $lte: new Date() },
  });
};

export const getMessages = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (!["accepted", "in-progress", "completed"].includes(booking.status)) {
    return res.status(400).json({ message: "Chat becomes available after the provider accepts the request" });
  }

  if (booking.scheduleChangeStatus === "pending") {
    return res.status(400).json({ message: "Chat will unlock after the user confirms the provider timing update" });
  }

  const isParticipant =
    String(booking.userId) === String(req.user._id) ||
    String(booking.providerId) === String(req.user._id) ||
    req.user.role === "admin";

  if (!isParticipant) {
    return res.status(403).json({ message: "Access denied" });
  }

  await clearExpiredMessages(req.params.bookingId);
  await Message.updateMany(
    {
      bookingId: req.params.bookingId,
      receiverId: req.user._id,
      seenAt: null,
    },
    {
      $set: { seenAt: new Date() },
    }
  );

  const messages = await Message.find({ bookingId: req.params.bookingId })
    .populate("senderId", "name role")
    .sort({ createdAt: 1 });

  res.json(messages);
};

export const sendMessage = async (req, res) => {
  const booking = await Booking.findById(req.body.bookingId);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (!["accepted", "in-progress", "completed"].includes(booking.status)) {
    return res.status(400).json({ message: "Chat becomes available after the provider accepts the request" });
  }

  if (booking.scheduleChangeStatus === "pending") {
    return res.status(400).json({ message: "Chat will unlock after the user confirms the provider timing update" });
  }

  await clearExpiredMessages(req.body.bookingId);

  const receiverId =
    String(booking.userId) === String(req.user._id) ? booking.providerId : booking.userId;

  const message = await Message.create({
    bookingId: booking._id,
    senderId: req.user._id,
    receiverId,
    text: req.body.text,
  });

  const populated = await Message.findById(message._id).populate("senderId", "name role");
  const io = req.app.get("io");
  if (io) {
    io.to(String(booking.userId)).emit("chat:new", populated);
    io.to(String(booking.providerId)).emit("chat:new", populated);
  }

  res.status(201).json(populated);
};
