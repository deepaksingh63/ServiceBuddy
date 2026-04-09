import Booking from "../models/Booking.js";
import Message from "../models/Message.js";
import Service from "../models/Service.js";
import User from "../models/User.js";

const emitBookingEvent = (req, booking, event = "booking:update") => {
  const io = req.app.get("io");
  if (io) {
    io.to(String(booking.userId)).emit(event, booking);
    io.to(String(booking.providerId)).emit(event, booking);
  }
};

export const createBooking = async (req, res) => {
  const serviceId = String(req.body.serviceId || "").trim();
  const service = await Service.findById(serviceId);
  if (!service) {
    return res.status(404).json({ message: "Service not found" });
  }

  const provider = await User.findById(service.providerId);
  if (!provider?.providerProfile?.isApproved) {
    return res.status(400).json({ message: "Provider is not approved yet" });
  }

  const booking = await Booking.create({
    userId: req.user._id,
    providerId: service.providerId,
    serviceId: service._id,
    date: req.body.date,
    time: req.body.time,
    customerName: req.body.customerName || req.user.name,
    customerPhone: req.body.customerPhone || req.user.phone,
    address: req.body.address,
    notes: req.body.notes,
    problemImage: req.file
      ? {
          fileName: req.file.originalname,
          fileUrl: `/uploads/booking-problems/${req.file.filename}`,
          mimeType: req.file.mimetype,
        }
      : undefined,
    paymentMethod: req.body.paymentMethod || "cash",
    totalAmount: service.price,
  });

  const populated = await Booking.findById(booking._id)
    .populate("serviceId")
    .populate("providerId", "name phone providerProfile")
    .populate("userId", "name email phone");

  emitBookingEvent(req, populated, "booking:new");
  res.status(201).json(populated);
};

export const getMyBookings = async (req, res) => {
  const filter =
    req.user.role === "provider"
      ? { providerId: req.user._id }
      : req.user.role === "admin"
        ? {}
        : { userId: req.user._id };

  const bookings = await Booking.find(filter)
    .populate("serviceId")
    .populate("providerId", "name phone providerProfile")
    .populate("userId", "name email phone")
    .sort({ createdAt: -1 });

  const bookingIds = bookings.map((booking) => booking._id);
  const unreadCounts = await Message.aggregate([
    {
      $match: {
        bookingId: { $in: bookingIds },
        receiverId: req.user._id,
        seenAt: null,
        expiresAt: { $gt: new Date() },
      },
    },
    {
      $group: {
        _id: "$bookingId",
        count: { $sum: 1 },
      },
    },
  ]);

  const unreadMap = unreadCounts.reduce((accumulator, item) => {
    accumulator[String(item._id)] = item.count;
    return accumulator;
  }, {});

  res.json(
    bookings.map((booking) => ({
      ...booking.toObject(),
      unreadMessageCount: unreadMap[String(booking._id)] || 0,
    }))
  );
};

export const updateBookingStatus = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("serviceId")
    .populate("providerId", "name phone providerProfile")
    .populate("userId", "name email phone");

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const isProviderOwner = String(booking.providerId._id) === String(req.user._id);
  const isBookingUser = String(booking.userId._id) === String(req.user._id);
  const isAdmin = req.user.role === "admin";

  if (!isProviderOwner && !isBookingUser && !isAdmin) {
    return res.status(403).json({ message: "Not allowed to update this booking" });
  }

  if (isBookingUser && req.body.scheduleChangeStatus) {
    if (!["pending", "accepted"].includes(booking.status)) {
      return res.status(400).json({ message: "This booking cannot be updated now" });
    }

    if (req.body.scheduleChangeStatus === "accepted") {
      booking.scheduleChangeStatus = "accepted";
      booking.status = "accepted";
    }

    if (req.body.scheduleChangeStatus === "rejected") {
      booking.scheduleChangeStatus = "rejected";
      booking.status = "cancelled";
      booking.userCancelReason = req.body.userCancelReason || "User rejected the provider's updated timing.";
    }

    if (req.body.status === "cancelled") {
      booking.status = "cancelled";
      booking.userCancelReason = req.body.userCancelReason || booking.userCancelReason || "Cancelled by user";
    }

    await booking.save();
    emitBookingEvent(req, booking);
    return res.json(booking);
  }

  if (req.body.status === "completed" && booking.paymentStatus !== "paid") {
    return res.status(400).json({ message: "Complete the payment before marking this booking as completed" });
  }

  if (req.body.status === "payment-pending") {
    if (!isProviderOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the provider can submit work completion proof" });
    }

    if (booking.status !== "in-progress") {
      return res.status(400).json({ message: "Work proof can only be submitted after the work starts" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a work completion photo" });
    }

    booking.status = "payment-pending";
    booking.completionProof = {
      fileName: req.file.originalname,
      fileUrl: `/uploads/booking-completion/${req.file.filename}`,
      mimeType: req.file.mimetype,
    };
    booking.completionLocation = {
      lat: Number(req.body.completionLocationLat || 0),
      lng: Number(req.body.completionLocationLng || 0),
      address: req.body.completionLocationAddress || "",
    };

    await booking.save();
    emitBookingEvent(req, booking);
    return res.json(booking);
  }

  booking.status = req.body.status || booking.status;
  if (typeof req.body.providerRejectReason === "string") {
    booking.providerRejectReason = req.body.providerRejectReason;
  }
  if (typeof req.body.userCancelReason === "string") {
    booking.userCancelReason = req.body.userCancelReason;
  }
  if (typeof req.body.providerScheduledDate === "string") {
    booking.providerScheduledDate = req.body.providerScheduledDate;
  }
  if (typeof req.body.providerScheduledTime === "string") {
    booking.providerScheduledTime = req.body.providerScheduledTime;
  }
  if (typeof req.body.providerScheduleNote === "string") {
    booking.providerScheduleNote = req.body.providerScheduleNote;
  }
  if (req.body.status === "accepted") {
    booking.scheduleChangeStatus =
      booking.providerScheduledDate || booking.providerScheduledTime ? "pending" : "accepted";
  }
  if (req.body.status === "rejected" || req.body.status === "cancelled") {
    booking.scheduleChangeStatus = "none";
  }
  if (req.body.status === "rejected" && !booking.providerRejectReason) {
    booking.providerRejectReason = "Provider is not available for this request.";
  }
  if (req.body.status === "cancelled" && !booking.userCancelReason && isBookingUser) {
    booking.userCancelReason = "Cancelled by user";
  }
  if (req.body.paymentStatus) {
    booking.paymentStatus = req.body.paymentStatus;
  }

  await booking.save();

  if (booking.status === "completed") {
    await User.findByIdAndUpdate(booking.providerId._id, {
      $inc: { "providerProfile.earnings": booking.totalAmount },
    });
  }

  emitBookingEvent(req, booking);
  res.json(booking);
};

export const deleteBookingHistory = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const isBookingUser = String(booking.userId) === String(req.user._id);
  if (!isBookingUser) {
    return res.status(403).json({ message: "Only the booking owner can delete this history item" });
  }

  if (!["completed", "cancelled", "rejected"].includes(booking.status)) {
    return res.status(400).json({ message: "Only completed, cancelled, or rejected bookings can be deleted" });
  }

  await Message.deleteMany({ bookingId: booking._id });
  await Booking.findByIdAndDelete(booking._id);

  res.json({ message: "Booking history deleted successfully", bookingId: req.params.id });
};
