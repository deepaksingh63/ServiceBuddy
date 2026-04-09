import crypto from "crypto";
import Razorpay from "razorpay";
import Booking from "../models/Booking.js";
import User from "../models/User.js";

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

export const createOrder = async (req, res) => {
  const booking = await Booking.findById(req.body.bookingId);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const isProviderOwner = String(booking.providerId) === String(req.user._id);
  const isBookingUser = String(booking.userId) === String(req.user._id);

  if (!isProviderOwner && !isBookingUser && req.user.role !== "admin") {
    return res.status(403).json({ message: "Not allowed to generate payment for this booking" });
  }

  if (booking.status !== "payment-pending") {
    return res.status(400).json({ message: "Online payment is available only after the provider submits work proof" });
  }

  if (booking.paymentStatus === "paid") {
    return res.status(400).json({ message: "This booking is already paid" });
  }

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: booking.totalAmount * 100,
    currency: "INR",
    receipt: String(booking._id),
  });

  res.json({
    order,
    key: process.env.RAZORPAY_KEY_ID,
    bookingId: booking._id,
  });
};

export const verifyPayment = async (req, res) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid payment signature" });
  }

  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    { paymentStatus: "paid", paymentMethod: "razorpay", status: "completed" },
    { new: true }
  );

  await User.findByIdAndUpdate(booking.providerId, {
    $inc: { "providerProfile.earnings": booking.totalAmount },
  });

  res.json({ message: "Payment verified", booking });
};

export const payByCash = async (req, res) => {
  const booking = await Booking.findById(req.body.bookingId);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const isProviderOwner = String(booking.providerId) === String(req.user._id);
  const isBookingUser = String(booking.userId) === String(req.user._id);

  if (!isProviderOwner && !isBookingUser && req.user.role !== "admin") {
    return res.status(403).json({ message: "Not allowed to update this booking payment" });
  }

  if (booking.status !== "payment-pending") {
    return res.status(400).json({ message: "Cash payment can be selected only after the provider submits work proof" });
  }

  booking.paymentMethod = "cash";
  booking.paymentStatus = "paid";
  booking.status = "completed";
  await booking.save();

  await User.findByIdAndUpdate(booking.providerId, {
    $inc: { "providerProfile.earnings": booking.totalAmount },
  });

  res.json({ message: "Cash payment confirmed", booking });
};

export const confirmOnlineQrPayment = async (req, res) => {
  const booking = await Booking.findById(req.body.bookingId);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const isProviderOwner = String(booking.providerId) === String(req.user._id);
  const isBookingUser = String(booking.userId) === String(req.user._id);

  if (!isProviderOwner && !isBookingUser && req.user.role !== "admin") {
    return res.status(403).json({ message: "Not allowed to update this booking payment" });
  }

  if (booking.status !== "payment-pending") {
    return res.status(400).json({ message: "QR payment is available only after work proof submission" });
  }

  booking.paymentMethod = "company-qr";
  booking.paymentStatus = "paid";
  booking.status = "completed";
  await booking.save();

  await User.findByIdAndUpdate(booking.providerId, {
    $inc: { "providerProfile.earnings": booking.totalAmount },
  });

  res.json({ message: "QR payment confirmed", booking });
};
