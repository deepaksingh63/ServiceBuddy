import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, MessageCircle, X } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import { api, getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import { getDistrictOptions, indiaStates } from "../../data/indiaLocations";

const initialService = {
  title: "",
  category: "",
  description: "",
  price: "",
  duration: "",
  country: "India",
  state: "",
  district: "",
  city: "",
  area: "",
};

const buildScheduleDrafts = (bookings) =>
  Object.fromEntries(
    bookings.map((booking) => [
      booking._id,
      {
        useRequestedTime: !booking.providerScheduledDate && !booking.providerScheduledTime,
        providerScheduledDate: booking.providerScheduledDate || booking.date || "",
        providerScheduledTime: booking.providerScheduledTime || booking.time || "",
        providerScheduleNote: booking.providerScheduleNote || "",
      },
    ])
  );

const getAssetUrl = (fileUrl) => {
  if (!fileUrl) {
    return "";
  }

  if (fileUrl.startsWith("http")) {
    return fileUrl;
  }

  return `${api.defaults.baseURL.replace(/\/api$/, "")}${fileUrl}`;
};

const ProviderDashboard = () => {
  const { user } = useAuth();
  const socket = useSocket(user?._id);
  const [dashboard, setDashboard] = useState(null);
  const [serviceForm, setServiceForm] = useState(initialService);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [messages, setMessages] = useState({});
  const [chatText, setChatText] = useState({});
  const [activeChatBookingId, setActiveChatBookingId] = useState("");
  const [messageNotifications, setMessageNotifications] = useState({});
  const [expandedBookingId, setExpandedBookingId] = useState("");
  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const [activeTab, setActiveTab] = useState("requests");
  const [rejectReasonByBooking, setRejectReasonByBooking] = useState({});
  const [completionProofFiles, setCompletionProofFiles] = useState({});
  const [completionLocations, setCompletionLocations] = useState({});
  const [qrPaymentBooking, setQrPaymentBooking] = useState(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(0);

  const loadDashboard = async () => {
    const { data } = await api.get("/provider/dashboard");
    setDashboard(data);
    setMessageNotifications(
      Object.fromEntries(data.bookings.map((booking) => [booking._id, booking.unreadMessageCount || 0]))
    );
    setScheduleDrafts(buildScheduleDrafts(data.bookings));
    setServiceForm((prev) => ({
      ...prev,
      country: data.profile?.providerProfile?.country || "India",
      state: data.profile?.providerProfile?.state || "",
      district: data.profile?.providerProfile?.district || "",
      city: data.profile?.providerProfile?.city || "",
      area: data.profile?.providerProfile?.area || "",
    }));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleIncomingMessage = (message) => {
      setMessages((prev) => ({
        ...prev,
        [message.bookingId]: [...(prev[message.bookingId] || []), message],
      }));

      if (activeChatBookingId !== message.bookingId) {
        setMessageNotifications((prev) => ({
          ...prev,
          [message.bookingId]: (prev[message.bookingId] || 0) + 1,
        }));
      }
    };

    socket.on("chat:new", handleIncomingMessage);

    return () => {
      socket.off("chat:new", handleIncomingMessage);
    };
  }, [activeChatBookingId, socket]);

  useEffect(() => {
    if (!qrPaymentBooking || qrSecondsLeft <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [qrPaymentBooking, qrSecondsLeft]);

  const createService = async (event) => {
    event.preventDefault();
    try {
      await api.post("/services", {
        ...serviceForm,
        price: Number(serviceForm.price),
        duration: Number(serviceForm.duration),
      });
      toast.success("Service added");
      setServiceForm(initialService);
      setShowServiceForm(false);
      await loadDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    const draft = scheduleDrafts[bookingId] || {};

    try {
      const payload = { status };

      if (status === "accepted") {
        payload.providerScheduledDate = draft.useRequestedTime ? "" : draft.providerScheduledDate || "";
        payload.providerScheduledTime = draft.useRequestedTime ? "" : draft.providerScheduledTime || "";
        payload.providerScheduleNote = draft.useRequestedTime
          ? "Provider will arrive at the requested booking time."
          : draft.providerScheduleNote || "Provider shared a custom arrival time.";
      }

      if (status === "rejected") {
        payload.providerRejectReason =
          rejectReasonByBooking[bookingId] || "Provider is not available for the requested job.";
        payload.providerScheduleNote = "";
        payload.providerScheduledDate = "";
        payload.providerScheduledTime = "";
      }

      await api.patch(`/bookings/${bookingId}/status`, payload);
      toast.success(`Request ${status}`);
      await loadDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const startWorkEarly = async (bookingId) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, {
        status: "in-progress",
        providerScheduleNote: "Provider arrived before the scheduled time and started the work early. Work proof can now be submitted after the service is done.",
      });
      toast.success("Early arrival updated");
      await loadDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const openChat = async (bookingId) => {
    if (activeChatBookingId === bookingId) {
      setActiveChatBookingId("");
      return;
    }

    try {
      const { data } = await api.get(`/chat/${bookingId}`);
      setMessages((prev) => ({ ...prev, [bookingId]: data }));
      setActiveChatBookingId(bookingId);
      setMessageNotifications((prev) => ({ ...prev, [bookingId]: 0 }));
      setDashboard((prev) => ({
        ...prev,
        bookings: prev.bookings.map((booking) =>
          booking._id === bookingId ? { ...booking, unreadMessageCount: 0 } : booking
        ),
      }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const sendMessage = async (bookingId) => {
    if (!chatText[bookingId]) {
      return;
    }

    try {
      await api.post("/chat", {
        bookingId,
        text: chatText[bookingId],
      });

      setChatText((prev) => ({ ...prev, [bookingId]: "" }));
      const { data } = await api.get(`/chat/${bookingId}`);
      setMessages((prev) => ({ ...prev, [bookingId]: data }));
      setActiveChatBookingId(bookingId);
      setMessageNotifications((prev) => ({ ...prev, [bookingId]: 0 }));
      setDashboard((prev) => ({
        ...prev,
        bookings: prev.bookings.map((booking) =>
          booking._id === bookingId ? { ...booking, unreadMessageCount: 0 } : booking
        ),
      }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const captureCompletionLocation = async (bookingId) => {
    if (!navigator.geolocation) {
      toast.error("Current location is not supported on this device");
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      setCompletionLocations((prev) => ({
        ...prev,
        [bookingId]: {
          lat: latitude,
          lng: longitude,
          address: data?.display_name || "",
        },
      }));

      toast.success("Current location added");
    } catch (error) {
      toast.error("Unable to capture current location");
    }
  };

  const submitWorkProof = async (bookingId) => {
    const proofFile = completionProofFiles[bookingId];
    const completionLocation = completionLocations[bookingId];

    if (!proofFile) {
      toast.error("Please upload a completion photo");
      return;
    }

    if (!completionLocation?.address) {
      toast.error("Please capture the current location");
      return;
    }

    try {
      const payload = new FormData();
      payload.append("status", "payment-pending");
      payload.append("completionProof", proofFile);
      payload.append("completionLocationLat", String(completionLocation.lat || 0));
      payload.append("completionLocationLng", String(completionLocation.lng || 0));
      payload.append("completionLocationAddress", completionLocation.address);

      await api.patch(`/bookings/${bookingId}/status`, payload);
      toast.success("Work proof submitted. Waiting for user payment.");
      await loadDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const openQrPayment = (booking) => {
    setQrPaymentBooking(booking);
    setQrSecondsLeft(300);
  };

  const confirmQrPayment = async () => {
    if (!qrPaymentBooking) {
      return;
    }

    if (qrSecondsLeft <= 0) {
      toast.error("This QR has expired. Please generate a new QR code.");
      return;
    }

    try {
      await api.post("/payments/confirm-online", { bookingId: qrPaymentBooking._id });
      toast.success("Online payment confirmed");
      setQrPaymentBooking(null);
      setQrSecondsLeft(0);
      await loadDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const confirmCashPayment = async (bookingId) => {
    try {
      await api.post("/payments/cash", { bookingId });
      toast.success("Cash payment confirmed");
      await loadDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const totalUnreadMessages = Object.values(messageNotifications).reduce((sum, count) => sum + count, 0);

  const districtOptions = getDistrictOptions(serviceForm.state);

  useEffect(() => {
    window.localStorage.setItem("providerUnreadMessages", String(totalUnreadMessages));
    window.dispatchEvent(new CustomEvent("provider-unread-updated", { detail: totalUnreadMessages }));
  }, [totalUnreadMessages]);

  if (!dashboard) {
    return (
      <AppLayout>
        <div className="p-10 text-center text-ink">Loading dashboard...</div>
      </AppLayout>
    );
  }

  const { profile, stats, services, bookings, reviews } = dashboard;
  const providerImage = getAssetUrl(profile.avatar);
  const pendingBookings = bookings.filter((booking) => booking.status === "pending");
  const approvedBookings = bookings.filter((booking) => booking.status === "accepted");
  const activeChats = bookings.filter((booking) =>
    ["accepted", "in-progress", "payment-pending", "completed"].includes(booking.status)
  );
  const tabs = [
    { key: "requests", label: `Requests (${pendingBookings.length})` },
    { key: "services", label: `My services (${services.length})` },
    { key: "chats", label: `Chats (${totalUnreadMessages})` },
    { key: "earnings", label: "Earnings" },
    { key: "reviews", label: `Reviews (${reviews.length})` },
  ];
  const qrValue = qrPaymentBooking
    ? `upi://pay?pa=servicebuddy@upi&pn=ServiceBuddy&am=${qrPaymentBooking.totalAmount}&cu=INR&tn=Booking-${qrPaymentBooking._id}`
    : "";
  const qrImageUrl = qrValue
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrValue)}`
    : "";

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand">Provider dashboard</p>
            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
              {profile.avatar ? (
                <img src={providerImage} alt={profile.name} className="h-24 w-24 rounded-[1.8rem] object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-sand text-4xl font-semibold text-brand">
                  {profile.name?.slice(0, 1)}
                </div>
              )}
              <div>
                <h1 className="text-4xl font-semibold text-ink">{profile.name}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/65">{profile.providerProfile?.bio}</p>
              </div>
            </div>
            {profile.providerProfile?.approvalMessage && (
              <div
                className={`mt-5 rounded-3xl px-4 py-3 text-sm font-semibold ${
                  profile.providerProfile?.isApproved
                    ? "bg-[#e8f5eb] text-[#1f7a38]"
                    : "bg-[#fdeaea] text-[#b42318]"
                }`}
              >
                {profile.providerProfile.approvalMessage}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-sand px-4 py-2 text-ink">
                Approval: {profile.providerProfile?.isApproved ? "Approved" : "Pending"}
              </span>
              {profile.providerProfile?.serviceCategory && (
                <span className="rounded-full bg-sand px-4 py-2 text-ink">
                  Category: {profile.providerProfile.serviceCategory}
                </span>
              )}
              <span className="rounded-full bg-[#e8f5eb] px-4 py-2 text-[#1f7a38]">
                {profile.providerProfile?.availabilityLabel || "Available today"}
                {profile.providerProfile?.nextAvailableSlot
                  ? ` | ${profile.providerProfile.nextAvailableSlot}`
                  : ""}
              </span>
              <span className="rounded-full bg-sand px-4 py-2 text-ink">
                {profile.providerProfile?.state}, {profile.providerProfile?.city}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Services", stats.totalServices],
              ["Bookings", stats.totalBookings],
              ["Completed", stats.completedBookings],
              ["Earnings", `Rs. ${stats.earnings}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.5rem] bg-white p-6 shadow-soft">
                <p className="text-sm text-ink/60">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? "rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
                  : "rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-soft"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.75rem] bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-ink">Add new service</h2>
                <p className="mt-2 text-sm text-ink/65">
                  Keep this closed until you want to create a new listing.
                </p>
              </div>
              <button
                type="button"
                className={showServiceForm ? "btn-secondary" : "btn-primary"}
                onClick={() => setShowServiceForm((prev) => !prev)}
              >
                {showServiceForm ? "Close form" : "Open form"}
              </button>
            </div>

            {showServiceForm && (
              <form onSubmit={createService} className="mt-6 grid gap-4">
                {[
                  ["title", "Service title"],
                  ["category", "Category"],
                  ["price", "Price"],
                  ["duration", "Duration in mins"],
                ].map(([field, placeholder]) => (
                  <input
                    key={field}
                    className="input"
                    placeholder={placeholder}
                    value={serviceForm[field]}
                    onChange={(e) => setServiceForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    required
                  />
                ))}
                <input
                  className="input"
                  value={serviceForm.country}
                  readOnly
                  placeholder="Country"
                />
                <input
                  className="input"
                  list="provider-service-state-options"
                  placeholder="State"
                  value={serviceForm.state}
                  onChange={(e) =>
                    setServiceForm((prev) => ({
                      ...prev,
                      state: e.target.value,
                      district: "",
                      city: "",
                      area: "",
                    }))
                  }
                  required
                />
                <datalist id="provider-service-state-options">
                  {indiaStates.map((state) => (
                    <option key={state} value={state} />
                  ))}
                </datalist>
                <input
                  className="input"
                  list="provider-service-district-options"
                  placeholder="District"
                  value={serviceForm.district}
                  onChange={(e) =>
                    setServiceForm((prev) => ({
                      ...prev,
                      district: e.target.value,
                      city: "",
                      area: "",
                    }))
                  }
                  required
                />
                <datalist id="provider-service-district-options">
                  {districtOptions.map((district) => (
                    <option key={district} value={district} />
                  ))}
                </datalist>
                <input
                  className="input"
                  placeholder="City"
                  value={serviceForm.city}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, city: e.target.value }))}
                  required
                />
                <input
                  className="input"
                  placeholder="Area / locality (optional)"
                  value={serviceForm.area}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, area: e.target.value }))}
                />
                <textarea
                  className="input min-h-28"
                  placeholder="Service description"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
                <button type="submit" className="btn-primary">
                  Add service
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            {activeTab === "services" && (
            <div className="rounded-[1.75rem] bg-white p-6 shadow-soft">
              <h2 className="text-2xl font-semibold text-ink">My services</h2>
              <div className="mt-5 grid gap-4">
                {services.map((service) => (
                  <div key={service._id} className="rounded-3xl bg-sand p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-ink">{service.title}</h3>
                        <p className="mt-1 text-sm text-ink/65">{service.category}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-brand">
                        Rs. {service.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {activeTab === "requests" && (
            <div className="rounded-[1.75rem] bg-white p-6 shadow-soft">
              <h2 className="text-2xl font-semibold text-ink">Requests</h2>
              <div className="mt-5 space-y-4">
                {bookings.map((booking) => {
                  const isExpanded = expandedBookingId === booking._id;
                  const draft = scheduleDrafts[booking._id] || {
                    useRequestedTime: true,
                    providerScheduledDate: booking.date || "",
                    providerScheduledTime: booking.time || "",
                    providerScheduleNote: "",
                  };

                  return (
                    <div key={booking._id} className="rounded-3xl bg-sand p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                        {booking.status === "pending" ? "Pending Request" : booking.status === "accepted" ? "Approved" : booking.status}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink">{booking.serviceId?.title}</p>
                      <p className="mt-1 text-sm text-ink/65">
                        {booking.customerName || booking.userId?.name || "Customer"} | {booking.date} | {booking.time}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink"
                          onClick={() =>
                            setExpandedBookingId((prev) => (prev === booking._id ? "" : booking._id))
                          }
                        >
                          Problem statement
                          <ChevronDown className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`} />
                        </button>

                        {booking.status === "accepted" && booking.scheduleChangeStatus !== "pending" && (
                          <>
                            <p className="inline-block rounded-full bg-[#e8f5eb] px-4 py-2 text-sm text-[#1f7a38]">
                              Approved. Chat is now available for this booking.
                            </p>
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink"
                              onClick={() => openChat(booking._id)}
                            >
                              <MessageCircle className="h-4 w-4" />
                              {activeChatBookingId === booking._id ? "Close chat" : "Open chat"}
                              {(messageNotifications[booking._id] || booking.unreadMessageCount) > 0 && (
                                <span className="ml-2 rounded-full bg-brand px-2 py-1 text-xs text-white">
                                  +{messageNotifications[booking._id] || booking.unreadMessageCount}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal"
                              onClick={() => startWorkEarly(booking._id)}
                            >
                              Arrived early
                            </button>
                          </>
                        )}

                        {booking.status === "in-progress" && booking.paymentStatus !== "paid" && (
                          <p className="inline-block rounded-full bg-[#fff3e8] px-4 py-2 text-sm text-[#b54708]">
                            If the work is finished, submit work photo and current location to unlock payment.
                          </p>
                        )}

                        {booking.status === "payment-pending" && booking.paymentStatus !== "paid" && (
                          <p className="inline-block rounded-full bg-[#fff3e8] px-4 py-2 text-sm text-[#b54708]">
                            Work proof submitted. Waiting for user payment.
                          </p>
                        )}

                        {booking.status === "completed" && booking.paymentStatus === "paid" && (
                          <p className="inline-block rounded-full bg-[#e8f5eb] px-4 py-2 text-sm text-[#1f7a38]">
                            Payment received. Booking completed successfully.
                          </p>
                        )}

                        {booking.status === "accepted" && booking.scheduleChangeStatus === "pending" && (
                          <p className="inline-block rounded-full bg-[#fff3e8] px-4 py-2 text-sm text-[#b54708]">
                            Provider timing sent. Waiting for user confirmation.
                          </p>
                        )}

                        {booking.status === "rejected" && (
                          <p className="inline-block rounded-full bg-[#fdeaea] px-4 py-2 text-sm text-[#b42318]">
                            Rejected. The user can see this update.
                          </p>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="mt-5 rounded-3xl bg-white p-5">
                          <div className="space-y-2 text-sm text-ink/70">
                            <p>
                              <span className="font-semibold text-ink">Customer:</span>{" "}
                              {booking.customerName || booking.userId?.name || "Not available"}
                            </p>
                            <p>
                              <span className="font-semibold text-ink">Contact:</span>{" "}
                              {booking.customerPhone || booking.userId?.phone || "Not available"}
                            </p>
                            <p>
                              <span className="font-semibold text-ink">Requested date:</span> {booking.date}
                            </p>
                            <p>
                              <span className="font-semibold text-ink">Requested time:</span> {booking.time}
                            </p>
                            <p>
                              <span className="font-semibold text-ink">Service address:</span> {booking.address}
                            </p>
                            {booking.notes && (
                              <p>
                                <span className="font-semibold text-ink">Problem details:</span> {booking.notes}
                              </p>
                            )}
                            {booking.problemImage?.fileUrl && (
                              <div className="pt-2">
                                <img
                                  src={getAssetUrl(booking.problemImage.fileUrl)}
                                  alt="Problem uploaded by user"
                                  className="h-48 w-full rounded-3xl object-cover"
                                />
                                <a
                                  href={getAssetUrl(booking.problemImage.fileUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-flex items-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-brand"
                                >
                                  Open full image
                                </a>
                              </div>
                            )}
                          </div>

                          {booking.status === "pending" && (
                            <div className="mt-5 rounded-3xl bg-sand p-4">
                              <h3 className="text-base font-semibold text-ink">Provider timing response</h3>
                              <div className="mt-4 space-y-3">
                                <label className="flex items-center gap-3 text-sm text-ink">
                                  <input
                                    type="radio"
                                    checked={draft.useRequestedTime}
                                    onChange={() =>
                                      setScheduleDrafts((prev) => ({
                                        ...prev,
                                        [booking._id]: {
                                          ...draft,
                                          useRequestedTime: true,
                                        },
                                      }))
                                    }
                                  />
                                  I will arrive at the requested date and time
                                </label>
                                <label className="flex items-center gap-3 text-sm text-ink">
                                  <input
                                    type="radio"
                                    checked={!draft.useRequestedTime}
                                    onChange={() =>
                                      setScheduleDrafts((prev) => ({
                                        ...prev,
                                        [booking._id]: {
                                          ...draft,
                                          useRequestedTime: false,
                                        },
                                      }))
                                    }
                                  />
                                  I want to share my own visit time
                                </label>
                              </div>

                              {!draft.useRequestedTime && (
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                  <input
                                    type="date"
                                    className="input"
                                    value={draft.providerScheduledDate}
                                    onChange={(e) =>
                                      setScheduleDrafts((prev) => ({
                                        ...prev,
                                        [booking._id]: {
                                          ...draft,
                                          providerScheduledDate: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <input
                                    type="time"
                                    className="input"
                                    value={draft.providerScheduledTime}
                                    onChange={(e) =>
                                      setScheduleDrafts((prev) => ({
                                        ...prev,
                                        [booking._id]: {
                                          ...draft,
                                          providerScheduledTime: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              )}

                              <textarea
                                className="input mt-4 min-h-24"
                                placeholder="Add a short timing note for the user"
                                value={draft.providerScheduleNote}
                                onChange={(e) =>
                                  setScheduleDrafts((prev) => ({
                                    ...prev,
                                    [booking._id]: {
                                      ...draft,
                                      providerScheduleNote: e.target.value,
                                    },
                                  }))
                                }
                              />

                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={() => updateBookingStatus(booking._id, "accepted")}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => updateBookingStatus(booking._id, "rejected")}
                                >
                                  Reject
                                </button>
                              </div>
                              <input
                                className="input mt-4"
                                placeholder="Reject reason"
                                value={rejectReasonByBooking[booking._id] || ""}
                                onChange={(e) =>
                                  setRejectReasonByBooking((prev) => ({
                                    ...prev,
                                    [booking._id]: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          )}

                          {!!(booking.providerScheduledDate || booking.providerScheduledTime || booking.providerScheduleNote) && (
                            <div className="mt-5 rounded-3xl bg-sand p-4 text-sm text-ink/70">
                              <p className="font-semibold text-ink">Provider response</p>
                              <p className="mt-2">
                                Visit date: {booking.providerScheduledDate || booking.date}
                              </p>
                              <p>Visit time: {booking.providerScheduledTime || booking.time}</p>
                              {booking.providerScheduleNote && <p className="mt-1">{booking.providerScheduleNote}</p>}
                              {booking.providerRejectReason && <p className="mt-1 text-[#b42318]">{booking.providerRejectReason}</p>}
                            </div>
                          )}

                          {booking.status === "in-progress" && (
                            <div className="mt-5 rounded-3xl bg-sand p-4">
                              <h3 className="text-base font-semibold text-ink">Work completion proof</h3>
                              <p className="mt-2 text-sm text-ink/65">
                                Upload a work photo and share your current location after the job is finished. This will unlock user payment, even if you reached early.
                              </p>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,.pdf"
                                className="input mt-4"
                                onChange={(e) =>
                                  setCompletionProofFiles((prev) => ({
                                    ...prev,
                                    [booking._id]: e.target.files?.[0] || null,
                                  }))
                                }
                              />
                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal"
                                  onClick={() => captureCompletionLocation(booking._id)}
                                >
                                  Use current location
                                </button>
                                {completionLocations[booking._id]?.address && (
                                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-ink/70">
                                    {completionLocations[booking._id].address}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                className="btn-primary mt-4"
                                onClick={() => submitWorkProof(booking._id)}
                              >
                                Submit work proof
                              </button>
                            </div>
                          )}

                          {booking.status === "payment-pending" && (
                            <div className="mt-5 rounded-3xl bg-sand p-4">
                              <h3 className="text-base font-semibold text-ink">Payment collection</h3>
                              <p className="mt-2 text-sm text-ink/65">
                                Show the company QR to the user or mark cash payment after collection.
                              </p>
                              {booking.completionProof?.fileUrl && (
                                <img
                                  src={getAssetUrl(booking.completionProof.fileUrl)}
                                  alt="Work completion proof"
                                  className="mt-4 h-48 w-full rounded-3xl object-cover"
                                />
                              )}
                              {booking.completionLocation?.address && (
                                <p className="mt-3 text-sm text-ink/70">{booking.completionLocation.address}</p>
                              )}
                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={() => openQrPayment(booking)}
                                >
                                  Open company QR
                                </button>
                                <button
                                  type="button"
                                  className="rounded-full bg-[#e8f5eb] px-5 py-3 text-sm font-semibold text-[#1f7a38] transition hover:bg-[#d8f0dd]"
                                  onClick={() => confirmCashPayment(booking._id)}
                                >
                                  Confirm cash payment
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeChatBookingId === booking._id &&
                        booking.scheduleChangeStatus !== "pending" &&
                        ["accepted", "in-progress", "payment-pending", "completed"].includes(booking.status) && (
                          <div className="mt-5 rounded-3xl bg-white p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <p className="text-sm font-semibold text-ink">Chat</p>
                            </div>
                            <div className="max-h-56 space-y-3 overflow-y-auto">
                              {(messages[booking._id] || []).map((message) => (
                                <div key={message._id} className="rounded-2xl bg-sand p-3 text-sm text-ink/75">
                                  <span className="font-semibold text-brand">{message.senderId?.name}: </span>
                                  {message.text}
                                  {message.seenAt && <span className="ml-2 text-xs text-ink/45">Seen</span>}
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 flex gap-3">
                              <input
                                className="input"
                                placeholder="Reply to user"
                                value={chatText[booking._id] || ""}
                                onChange={(e) =>
                                  setChatText((prev) => ({ ...prev, [booking._id]: e.target.value }))
                                }
                              />
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={() => sendMessage(booking._id)}
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
            )}

            {activeTab === "reviews" && (
            <div className="rounded-[1.75rem] bg-white p-6 shadow-soft">
              <h2 className="text-2xl font-semibold text-ink">Latest reviews</h2>
              <div className="mt-5 space-y-4">
                {reviews.slice(0, 4).map((review) => (
                  <div key={review._id} className="rounded-3xl bg-sand p-4">
                    <p className="text-sm font-semibold text-brand">{review.rating} / 5</p>
                    <p className="mt-2 text-sm leading-6 text-ink/70">{review.comment}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/45">{review.userId?.name}</p>
                  </div>
                ))}
              </div>
            </div>
            )}

            {activeTab === "chats" && (
              <div className="rounded-[1.75rem] bg-white p-6 shadow-soft">
                <h2 className="text-2xl font-semibold text-ink">Notifications and chats</h2>
                <div className="mt-5 space-y-4">
                  {activeChats.map((booking) => (
                    <div key={booking._id} className="rounded-3xl bg-sand p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-ink">{booking.serviceId?.title}</p>
                          <p className="mt-1 text-sm text-ink/65">
                            {booking.customerName || booking.userId?.name}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink"
                          onClick={() => openChat(booking._id)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          {activeChatBookingId === booking._id ? "Close chat" : "Open chat"}
                          {(messageNotifications[booking._id] || booking.unreadMessageCount) > 0 && (
                            <span className="rounded-full bg-brand px-2 py-1 text-xs text-white">
                              +{messageNotifications[booking._id] || booking.unreadMessageCount}
                            </span>
                          )}
                        </button>
                      </div>

                      {activeChatBookingId === booking._id && (
                        <div className="mt-5 rounded-3xl bg-white p-4">
                          <div className="max-h-56 space-y-3 overflow-y-auto">
                            {(messages[booking._id] || []).map((message) => (
                              <div key={message._id} className="rounded-2xl bg-sand p-3 text-sm text-ink/75">
                                <span className="font-semibold text-brand">{message.senderId?.name}: </span>
                                {message.text}
                                {message.seenAt && <span className="ml-2 text-xs text-ink/45">Seen</span>}
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex gap-3">
                            <input
                              className="input"
                              placeholder="Reply to user"
                              value={chatText[booking._id] || ""}
                              onChange={(e) =>
                                setChatText((prev) => ({ ...prev, [booking._id]: e.target.value }))
                              }
                            />
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => sendMessage(booking._id)}
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "earnings" && (
              <div className="rounded-[1.75rem] bg-white p-6 shadow-soft">
                <h2 className="text-2xl font-semibold text-ink">Earnings overview</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl bg-sand p-5">
                    <p className="text-sm text-ink/60">Total earnings</p>
                    <p className="mt-2 text-3xl font-semibold text-ink">Rs. {stats.earnings}</p>
                  </div>
                  <div className="rounded-3xl bg-sand p-5">
                    <p className="text-sm text-ink/60">Completed jobs</p>
                    <p className="mt-2 text-3xl font-semibold text-ink">{stats.completedBookings}</p>
                  </div>
                </div>
                <div className="mt-5 rounded-3xl bg-sand p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Latest updates</p>
                  <div className="mt-4 space-y-3 text-sm text-ink/70">
                    {bookings.slice(0, 5).map((booking) => (
                      <p key={booking._id}>
                        {booking.serviceId?.title} | {booking.status === "accepted" ? "Approved" : booking.status}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {qrPaymentBooking && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/55 px-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-[0_30px_80px_rgba(15,29,40,0.34)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Company payment QR</p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">Collect online payment</h3>
                <p className="mt-2 text-sm text-ink/65">
                  Show this QR to the user for `{qrPaymentBooking.serviceId?.title}`.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-ink/10 p-2 text-ink"
                onClick={() => {
                  setQrPaymentBooking(null);
                  setQrSecondsLeft(0);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-sand p-5 text-center">
              <img src={qrImageUrl} alt="ServiceBuddy company payment QR" className="mx-auto h-60 w-60 rounded-3xl bg-white p-3" />
              <p className="mt-4 text-lg font-semibold text-ink">Amount: Rs. {qrPaymentBooking.totalAmount}</p>
              <p className="mt-2 text-sm text-[#b54708]">
                QR valid for: {String(Math.floor(qrSecondsLeft / 60)).padStart(2, "0")}:
                {String(qrSecondsLeft % 60).padStart(2, "0")}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={qrSecondsLeft <= 0}
                onClick={confirmQrPayment}
              >
                Confirm online payment
              </button>
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => {
                  setQrPaymentBooking(null);
                  setQrSecondsLeft(0);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ProviderDashboard;
