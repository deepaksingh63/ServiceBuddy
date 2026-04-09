import AdminAction from "../models/AdminAction.js";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import User from "../models/User.js";

const categoryFallbackBySkill = {
  Wiring: "Electrician",
  "Switch repair": "Electrician",
  "Fan installation": "Electrician",
  "Light repair": "Electrician",
  "Inverter support": "Electrician",
  "Deep cleaning": "Cleaner",
  "Bathroom cleaning": "Cleaner",
  "Kitchen cleaning": "Cleaner",
  "Sofa cleaning": "Cleaner",
  "Office cleaning": "Cleaner",
  "Tap repair": "Plumber",
  "Pipe fitting": "Plumber",
  "Leakage repair": "Plumber",
  "Drain cleaning": "Plumber",
  "Bathroom plumbing": "Plumber",
  "Wall repair": "Mason",
  "Tiles work": "Mason",
  "Plaster work": "Mason",
  "Brick work": "Mason",
  "Floor repair": "Mason",
  "Home meals": "Cook",
  "Party cooking": "Cook",
  "Breakfast service": "Cook",
  "Lunch and dinner": "Cook",
  "Event cooking": "Cook",
  Loading: "Labour",
  Unloading: "Labour",
  "Shifting help": "Labour",
  "Furniture moving": "Labour",
  "Helper work": "Labour",
};

const inferCategory = (provider) =>
  provider.providerProfile?.serviceCategory ||
  categoryFallbackBySkill[provider.providerProfile?.skills?.[0]] ||
  "General";

const getProviderRequestedPrice = (provider) => {
  const rawValue = String(provider.providerProfile?.pricingNote || "");
  const matchedNumber = rawValue.match(/\d+/);
  const requestedAmount = Number(matchedNumber?.[0] || 0);
  return requestedAmount > 0 ? requestedAmount : 399;
};

const getCustomerVisiblePrice = (provider) => getProviderRequestedPrice(provider) + 100;

const createServicePayloads = (provider) => {
  const category = inferCategory(provider);
  const skills = provider.providerProfile?.skills?.length
    ? provider.providerProfile.skills
    : [category];
  const customerPrice = getCustomerVisiblePrice(provider);

  return skills.map((skill) => ({
    title: `${skill} Service`,
    category,
    description: `${provider.name} provides ${skill.toLowerCase()} support with local service coverage.`,
    price: customerPrice,
    duration: 90,
    tags: [category.toLowerCase(), skill.toLowerCase()],
    providerId: provider._id,
    city: provider.providerProfile?.city || "",
    area: provider.providerProfile?.area || "",
  }));
};

export const getAdminDashboard = async (req, res) => {
  const [users, providers, bookings, services, adminActions] = await Promise.all([
    User.find().select("-password").sort({ createdAt: -1 }),
    User.find({ role: "provider" }).select("-password").sort({ createdAt: -1 }),
    Booking.find()
      .populate("userId", "name email")
      .populate("providerId", "name email")
      .populate("serviceId", "title price")
      .sort({ createdAt: -1 }),
    Service.find().populate("providerId", "name").sort({ createdAt: -1 }),
    AdminAction.find().sort({ createdAt: -1 }).limit(10),
  ]);

  res.json({
    stats: {
      totalUsers: users.filter((user) => user.role === "user").length,
      totalProviders: providers.length,
      approvedProviders: providers.filter((provider) => provider.providerProfile?.isApproved).length,
      totalBookings: bookings.length,
      totalRevenue: bookings
        .filter((booking) => booking.status === "completed")
        .reduce((sum, booking) => sum + booking.totalAmount, 0),
      activeServices: services.filter((service) => service.isActive).length,
    },
    users,
    providers,
    bookings,
    services,
    adminActions,
  });
};

export const approveProvider = async (req, res) => {
  const provider = await User.findOne({ _id: req.params.id, role: "provider" });
  if (!provider) {
    return res.status(404).json({ message: "Provider not found" });
  }

  provider.providerProfile.isApproved = req.body.isApproved;
  provider.providerProfile.approvalMessage = req.body.isApproved
    ? `Your provider profile has been approved for ${inferCategory(provider)} services.`
    : "Your provider approval has been revoked by admin.";
  await provider.save();

  await AdminAction.create({
    actorId: req.user._id,
    actorName: req.user.name,
    targetUserId: provider._id,
    targetName: provider.name,
    actionType: req.body.isApproved ? "provider-approved" : "provider-revoked",
    message: req.body.isApproved
      ? `Approved ${provider.name} for ${inferCategory(provider)} services.`
      : `Revoked provider approval for ${provider.name}.`,
  });

  if (req.body.isApproved) {
    const servicePayloads = createServicePayloads(provider);

    for (const payload of servicePayloads) {
      const existingService = await Service.findOne({
        providerId: provider._id,
        category: payload.category,
        title: payload.title,
      });

      if (existingService) {
        existingService.description = payload.description;
        existingService.price = payload.price;
        existingService.city = payload.city;
        existingService.area = payload.area;
        existingService.isActive = true;
        await existingService.save();
      } else {
        await Service.create(payload);
      }
    }
  }

  res.json(provider);
};

export const updateUserRole = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.role = req.body.role || user.role;
  await user.save();

  await AdminAction.create({
    actorId: req.user._id,
    actorName: req.user.name,
    targetUserId: user._id,
    targetName: user.name,
    actionType: "role-updated",
    message: `Updated ${user.name}'s role to ${user.role}.`,
  });

  res.json(user);
};
