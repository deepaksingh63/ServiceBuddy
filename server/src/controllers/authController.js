import crypto from "crypto";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateToken } from "../utils/generateToken.js";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: false,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = generateToken(user._id);
  res.cookie(process.env.COOKIE_NAME || "service_marketplace_token", token, cookieOptions);
  res.status(statusCode).json({
    message: "Authentication successful",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      providerProfile: user.providerProfile,
    },
  });
};

export const register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const idProofFile = req.files?.idProofDocument?.[0];
  const avatarFile = req.files?.avatar?.[0];
  const providerProfile =
    typeof req.body.providerProfile === "string"
      ? JSON.parse(req.body.providerProfile)
      : req.body.providerProfile;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  if (role === "provider") {
    if (!providerProfile?.idProofType || !idProofFile) {
      return res.status(400).json({ message: "Provider ID proof type and document are required" });
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || "user",
    phone,
    avatar: avatarFile ? `/uploads/provider-registration/${avatarFile.filename}` : "",
    providerProfile:
      role === "provider"
        ? {
            ...providerProfile,
            isApproved: false,
            idProofDocument: idProofFile
              ? {
                  fileName: idProofFile.originalname,
                  fileUrl: `/uploads/provider-registration/${idProofFile.filename}`,
                  mimeType: idProofFile.mimetype,
                }
              : undefined,
          }
        : undefined,
  });

  sendAuthResponse(res, user, 201);
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  sendAuthResponse(res, user);
};

export const logout = async (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME || "service_marketplace_token");
  res.json({ message: "Logged out successfully" });
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(user);
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "No account found with this email" });
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save();

  const clientOrigin =
    req.headers.origin && /^http:\/\/localhost:\d+$/.test(req.headers.origin)
      ? req.headers.origin
      : process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientOrigin}/reset-password/${resetToken}`;
  const emailSent = await sendEmail({
    to: user.email,
    subject: "Reset your ServiceBuddy password",
    text: `Reset your password using this link: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #11212d;">
        <h2>Reset your password</h2>
        <p>We received a request to reset your ServiceBuddy password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#11212d;color:#ffffff;text-decoration:none;border-radius:999px;">
            Reset Password
          </a>
        </p>
        <p>If the button does not work, use this link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 15 minutes.</p>
      </div>
    `,
  });

  res.json({
    message: emailSent
      ? "Password reset link sent to your email"
      : "Password reset link generated. SMTP not configured, so use the link below.",
    resetUrl,
    emailSent,
  });
};

export const resetPassword = async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Reset link invalid or expired" });
  }

  user.password = req.body.password;
  user.resetPasswordToken = "";
  user.resetPasswordExpires = null;
  await user.save();

  res.json({ message: "Password reset successful. Please login now." });
};
