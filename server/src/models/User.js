import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["user", "provider", "admin"],
      default: "user",
    },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    resetPasswordToken: { type: String, default: "" },
    resetPasswordExpires: { type: Date, default: null },
    providerProfile: {
      bio: { type: String, default: "" },
      experience: { type: Number, default: 0 },
      skills: [{ type: String }],
      serviceCategory: { type: String, default: "" },
      pricingNote: { type: String, default: "" },
      isApproved: { type: Boolean, default: false },
      approvalMessage: { type: String, default: "" },
      isAvailable: { type: Boolean, default: true },
      availabilityLabel: { type: String, default: "Available today" },
      nextAvailableSlot: { type: String, default: "" },
      country: { type: String, default: "India" },
      state: { type: String, default: "" },
      district: { type: String, default: "" },
      city: { type: String, default: "" },
      area: { type: String, default: "" },
      address: { type: String, default: "" },
      pincode: { type: String, default: "" },
      whatsappNumber: { type: String, default: "" },
      idProofType: { type: String, default: "" },
      idProofNumber: { type: String, default: "" },
      idProofDocument: {
        fileName: { type: String, default: "" },
        fileUrl: { type: String, default: "" },
        mimeType: { type: String, default: "" },
      },
      coordinates: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
      },
      earnings: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function handlePassword(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generatePasswordResetToken = function generatePasswordResetToken() {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

export default User;
