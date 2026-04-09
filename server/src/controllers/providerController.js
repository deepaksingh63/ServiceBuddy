import Booking from "../models/Booking.js";
import Message from "../models/Message.js";
import Review from "../models/Review.js";
import Service from "../models/Service.js";

export const getProviderDashboard = async (req, res) => {
  const [services, bookings, reviews] = await Promise.all([
    Service.find({ providerId: req.user._id, isActive: true }).sort({ createdAt: -1 }),
    Booking.find({ providerId: req.user._id })
      .populate("userId", "name phone")
      .populate("serviceId", "title price")
      .sort({ createdAt: -1 }),
    Review.find({ providerId: req.user._id })
      .populate("userId", "name")
      .populate("serviceId", "title")
      .sort({ createdAt: -1 }),
  ]);

  const stats = {
    totalServices: services.length,
    totalBookings: bookings.length,
    completedBookings: bookings.filter((booking) => booking.status === "completed").length,
    pendingBookings: bookings.filter((booking) => booking.status === "pending").length,
    earnings: bookings
      .filter((booking) => booking.status === "completed")
      .reduce((sum, booking) => sum + booking.totalAmount, 0),
    averageRating:
      reviews.length > 0
        ? Number(
            (
              reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            ).toFixed(1)
          )
        : 0,
  };

  const unreadCounts = await Message.aggregate([
    {
      $match: {
        bookingId: { $in: bookings.map((booking) => booking._id) },
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

  res.json({
    profile: req.user,
    stats,
    services,
    bookings: bookings.map((booking) => ({
      ...booking.toObject(),
      unreadMessageCount: unreadMap[String(booking._id)] || 0,
    })),
    reviews,
  });
};
