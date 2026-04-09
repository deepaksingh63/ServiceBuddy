import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import Service from "../models/Service.js";

const refreshServiceRating = async (serviceId) => {
  const reviews = await Review.find({ serviceId });
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, item) => sum + item.rating, 0) / totalReviews
      : 0;

  await Service.findByIdAndUpdate(serviceId, {
    averageRating: Number(averageRating.toFixed(1)),
    totalReviews,
  });
};

export const addReview = async (req, res) => {
  const booking = await Booking.findById(req.body.bookingId).populate("serviceId providerId");

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (String(booking.userId) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only booking user can review" });
  }

  if (booking.status !== "completed") {
    return res.status(400).json({ message: "Review allowed only after completion" });
  }

  const existing = await Review.findOne({ bookingId: booking._id });
  if (existing) {
    return res.status(400).json({ message: "Review already submitted" });
  }

  const review = await Review.create({
    userId: req.user._id,
    providerId: booking.providerId._id,
    serviceId: booking.serviceId._id,
    bookingId: booking._id,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  await refreshServiceRating(booking.serviceId._id);
  res.status(201).json(review);
};

export const getProviderReviews = async (req, res) => {
  const reviews = await Review.find({ providerId: req.params.providerId })
    .populate("userId", "name")
    .populate("serviceId", "title")
    .sort({ createdAt: -1 });

  res.json(reviews);
};

