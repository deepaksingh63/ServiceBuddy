import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import Service from "../models/Service.js";
import User from "../models/User.js";

dotenv.config();
await connectDB();

await Promise.all([
  Booking.deleteMany(),
  Review.deleteMany(),
  Service.deleteMany(),
  User.deleteMany(),
]);

const admin = await User.create({
  name: "Admin",
  email: "admin@servicemarketplace.com",
  password: "Admin@123",
  role: "admin",
});

const provider = await User.create({
  name: "Ravi Electric Works",
  email: "provider@servicemarketplace.com",
  password: "Provider@123",
  role: "provider",
  phone: "9876543210",
  providerProfile: {
    bio: "Certified electrician with 6 years of on-site experience.",
    experience: 6,
    skills: ["Electrician", "Fan repair", "Wiring"],
    pricingNote: "Transparent visit charges and same-day support.",
    isApproved: true,
    state: "Delhi",
    city: "Delhi",
    area: "Rohini",
    address: "Sector 7, Rohini, Delhi",
    pincode: "110085",
    whatsappNumber: "9876543210",
    coordinates: { lat: 28.7383, lng: 77.0822 },
    earnings: 4200,
  },
});

const user = await User.create({
  name: "Aman Sharma",
  email: "user@servicemarketplace.com",
  password: "User@123",
  role: "user",
  phone: "9999999999",
});

const cleaningProvider = await User.create({
  name: "Sparkle Home Care",
  email: "cleaner@servicemarketplace.com",
  password: "Provider@123",
  role: "provider",
  phone: "9123456780",
  providerProfile: {
    bio: "Deep cleaning specialists for homes and small offices.",
    experience: 4,
    skills: ["Cleaning", "Sanitization"],
    pricingNote: "Eco-friendly chemicals included.",
    isApproved: true,
    state: "Delhi",
    city: "Delhi",
    area: "Pitampura",
    address: "Pitampura, Delhi",
    pincode: "110034",
    whatsappNumber: "9123456780",
  },
});

const plumbingProvider = await User.create({
  name: "FlowFix Plumbing",
  email: "plumber@servicemarketplace.com",
  password: "Provider@123",
  role: "provider",
  phone: "9000011111",
  providerProfile: {
    bio: "Home plumbing expert for tap leaks, pipe fitting, and bathroom repairs.",
    experience: 5,
    skills: ["Plumber", "Tap repair", "Pipe fitting"],
    pricingNote: "Visit charge starts from Rs. 249.",
    isApproved: true,
    state: "Delhi",
    city: "Delhi",
    area: "Janakpuri",
    address: "Block C, Janakpuri, Delhi",
    pincode: "110058",
    whatsappNumber: "9000011111",
  },
});

const labourProvider = await User.create({
  name: "QuickHelp Labour Services",
  email: "labour@servicemarketplace.com",
  password: "Provider@123",
  role: "provider",
  phone: "9000022222",
  providerProfile: {
    bio: "Reliable labour support for shifting, loading, unloading, and helper work.",
    experience: 3,
    skills: ["Labour", "Shifting help", "Loading work"],
    pricingNote: "Half-day and full-day labour booking available.",
    isApproved: true,
    state: "Delhi",
    city: "Delhi",
    area: "Karol Bagh",
    address: "Karol Bagh, Delhi",
    pincode: "110005",
    whatsappNumber: "9000022222",
  },
});

const masonProvider = await User.create({
  name: "Solid Brick Masonry",
  email: "mason@servicemarketplace.com",
  password: "Provider@123",
  role: "provider",
  phone: "9000033333",
  providerProfile: {
    bio: "Experienced mason for wall repair, tiles work, plaster, and small construction jobs.",
    experience: 7,
    skills: ["Mason", "Wall repair", "Tiles work"],
    pricingNote: "Inspection and work estimate shared after site visit.",
    isApproved: true,
    state: "Delhi",
    city: "Delhi",
    area: "Dwarka",
    address: "Sector 10, Dwarka, Delhi",
    pincode: "110075",
    whatsappNumber: "9000033333",
  },
});

const cookProvider = await User.create({
  name: "Tasty Home Cook Services",
  email: "cook@servicemarketplace.com",
  password: "Provider@123",
  role: "provider",
  phone: "9000044444",
  providerProfile: {
    bio: "Home cook available for daily meals, party orders, and family cooking support.",
    experience: 6,
    skills: ["Cook", "Home meals", "Party cooking"],
    pricingNote: "Daily and per-visit cooking plans available.",
    isApproved: true,
    state: "Delhi",
    city: "Delhi",
    area: "Laxmi Nagar",
    address: "Laxmi Nagar, Delhi",
    pincode: "110092",
    whatsappNumber: "9000044444",
  },
});

const services = await Service.insertMany([
  {
    title: "Home Electrical Repair",
    category: "Electrician",
    description: "Switchboard, fan, light, and wiring fixes at home.",
    price: 499,
    duration: 90,
    tags: ["trusted", "same-day"],
    providerId: provider._id,
    city: "Delhi",
    area: "Rohini",
    averageRating: 4.8,
    totalReviews: 1,
  },
  {
    title: "Full Home Deep Cleaning",
    category: "Cleaner",
    description: "Kitchen, bathroom, floor, and sofa cleaning package.",
    price: 1499,
    duration: 180,
    tags: ["eco-friendly", "weekend"],
    providerId: cleaningProvider._id,
    city: "Delhi",
    area: "Pitampura",
  },
  {
    title: "Kitchen and Bathroom Plumbing",
    category: "Plumber",
    description: "Leakage repair, tap replacement, pipe fitting, and drainage fixes.",
    price: 699,
    duration: 120,
    tags: ["plumber", "repair"],
    providerId: plumbingProvider._id,
    city: "Delhi",
    area: "Janakpuri",
  },
  {
    title: "Home Shifting Labour Support",
    category: "Labour",
    description: "Helpers for shifting, loading, unloading, and general support work.",
    price: 899,
    duration: 240,
    tags: ["labour", "shifting"],
    providerId: labourProvider._id,
    city: "Delhi",
    area: "Karol Bagh",
  },
  {
    title: "Wall Repair and Mason Work",
    category: "Mason",
    description: "Wall crack repair, plaster work, tiles fitting, and small masonry jobs.",
    price: 1299,
    duration: 240,
    tags: ["mason", "repair"],
    providerId: masonProvider._id,
    city: "Delhi",
    area: "Dwarka",
  },
  {
    title: "Home Cook Visit Service",
    category: "Cook",
    description: "Fresh home-style cooking for breakfast, lunch, dinner, and family meal support.",
    price: 999,
    duration: 180,
    tags: ["cook", "meal service"],
    providerId: cookProvider._id,
    city: "Delhi",
    area: "Laxmi Nagar",
  },
]);

const booking = await Booking.create({
  userId: user._id,
  providerId: provider._id,
  serviceId: services[0]._id,
  date: "2026-04-02",
  time: "11:00",
  address: "Shalimar Bagh, Delhi",
  notes: "Need repair for ceiling fan.",
  status: "completed",
  totalAmount: 499,
  paymentStatus: "paid",
});

await Review.create({
  userId: user._id,
  providerId: provider._id,
  serviceId: services[0]._id,
  bookingId: booking._id,
  rating: 5,
  comment: "Quick and professional work.",
});

console.log("Seed data created");
await mongoose.disconnect();
