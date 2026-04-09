import mongoose from "mongoose";

const adminActionSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, default: "" },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    targetName: { type: String, default: "" },
    actionType: {
      type: String,
      enum: ["provider-approved", "provider-revoked", "role-updated"],
      required: true,
    },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const AdminAction = mongoose.model("AdminAction", adminActionSchema);

export default AdminAction;
