import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    customerName: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    address: { type: String, required: true },
    notes: { type: String, default: "" },
    providerScheduledDate: { type: String, default: "" },
    providerScheduledTime: { type: String, default: "" },
    providerScheduleNote: { type: String, default: "" },
    providerRejectReason: { type: String, default: "" },
    userCancelReason: { type: String, default: "" },
    scheduleChangeStatus: {
      type: String,
      enum: ["none", "pending", "accepted", "rejected"],
      default: "none",
    },
    problemImage: {
      fileName: { type: String, default: "" },
      fileUrl: { type: String, default: "" },
      mimeType: { type: String, default: "" },
    },
    completionProof: {
      fileName: { type: String, default: "" },
      fileUrl: { type: String, default: "" },
      mimeType: { type: String, default: "" },
    },
    completionLocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
      address: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "in-progress", "payment-pending", "completed", "cancelled"],
      default: "pending",
    },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentMethod: { type: String, default: "cash" },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
