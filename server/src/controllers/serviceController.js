import Service from "../models/Service.js";

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
    country: provider.providerProfile?.country || "India",
    state: provider.providerProfile?.state || "",
    district: provider.providerProfile?.district || "",
    city: provider.providerProfile?.city || "",
    area: provider.providerProfile?.area || "",
  }));
};

export const getServices = async (req, res) => {
  const { category, city, state, area, search } = req.query;
  const query = { isActive: true };

  if (category) {
    query.category = new RegExp(category, "i");
  }

  if (city) {
    query.city = new RegExp(city, "i");
  }

  if (area) {
    query.area = new RegExp(area, "i");
  }

  if (search) {
    query.$or = [
      { title: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
      { category: new RegExp(search, "i") },
    ];
  }

  const services = await Service.find(query)
    .populate(
      "providerId",
      [
        "avatar",
        "name",
        "phone",
        "providerProfile.country",
        "providerProfile.city",
        "providerProfile.district",
        "providerProfile.area",
        "providerProfile.state",
        "providerProfile.experience",
        "providerProfile.isApproved",
        "providerProfile.availabilityLabel",
        "providerProfile.nextAvailableSlot",
        "providerProfile.whatsappNumber",
        "providerProfile.pricingNote",
      ].join(" ")
    )
    .sort({ createdAt: -1 });

  const filtered = services.filter((service) => {
    const approved = service.providerId?.providerProfile?.isApproved;
    const matchesState = state
      ? new RegExp(state, "i").test(service.providerId?.providerProfile?.state || "")
      : true;

    return approved && matchesState;
  });
  res.json(filtered);
};

export const getProviderServices = async (req, res) => {
  const services = await Service.find({ providerId: req.user._id }).sort({ createdAt: -1 });
  res.json(services);
};

export const getServiceById = async (req, res) => {
  const service = await Service.findById(req.params.id).populate(
    "providerId",
    [
      "avatar",
      "name",
      "phone",
        "providerProfile.country",
        "providerProfile.city",
        "providerProfile.district",
      "providerProfile.area",
      "providerProfile.state",
      "providerProfile.address",
      "providerProfile.experience",
      "providerProfile.isApproved",
      "providerProfile.availabilityLabel",
      "providerProfile.nextAvailableSlot",
      "providerProfile.whatsappNumber",
      "providerProfile.pricingNote",
    ].join(" ")
  );

  if (!service || !service.isActive || !service.providerId?.providerProfile?.isApproved) {
    return res.status(404).json({ message: "Service not found" });
  }

  res.json(service);
};

export const createService = async (req, res) => {
  if (req.user.role !== "provider") {
    return res.status(403).json({ message: "Only providers can add services" });
  }

  const service = await Service.create({
    ...req.body,
    providerId: req.user._id,
    country: req.body.country || req.user.providerProfile?.country || "India",
    state: req.body.state || req.user.providerProfile?.state,
    district: req.body.district || req.user.providerProfile?.district,
    city: req.body.city || req.user.providerProfile?.city,
    area: req.body.area || req.user.providerProfile?.area,
  });

  res.status(201).json(service);
};

export const updateService = async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, providerId: req.user._id });
  if (!service) {
    return res.status(404).json({ message: "Service not found" });
  }

  Object.assign(service, req.body);
  await service.save();
  res.json(service);
};

export const deleteService = async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, providerId: req.user._id });
  if (!service) {
    return res.status(404).json({ message: "Service not found" });
  }

  service.isActive = false;
  await service.save();
  res.json({ message: "Service removed" });
};

export const getTopProviders = async (req, res) => {
  const providers = await User.find({
    role: "provider",
    "providerProfile.isApproved": true,
  })
    .select("name providerProfile")
    .sort({ "providerProfile.earnings": -1 })
    .limit(6);

  res.json(providers);
};
