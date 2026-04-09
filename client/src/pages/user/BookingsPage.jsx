import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MessageCircle, Star } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import { api, getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";

const SUPPORT_NUMBER = "+91 98765 43210";
const cancelReasonSuggestions = [
  "No longer needed",
  "Booked by mistake",
  "Provider timing does not work",
  "Found another provider",
  "Need to reschedule later",
];

const formatBookingStatusLabel = (booking) => {
  if (booking.status === "pending") return "Pending request";
  if (booking.status === "accepted") {
    return booking.scheduleChangeStatus === "pending" ? "Timing confirmation pending" : "Approved";
  }
  if (booking.status === "payment-pending") return "Payment pending";
  if (booking.status === "in-progress") return "In progress";
  if (booking.status === "completed") return "Completed";
  if (booking.status === "rejected") return "Rejected";
  if (booking.status === "cancelled") return "Cancelled";
  return booking.status || "Update";
};

const getInvoiceNumber = (booking) => {
  const rawId = String(booking?._id || "").slice(-6).toUpperCase();
  const bookingDate = String(booking?.createdAt || booking?.date || "")
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll("T", "")
    .slice(0, 8);
  return `SB-${bookingDate || "00000000"}-${rawId || "BOOKING"}`;
};

const timelineSteps = (booking) => {
  const steps = [
    { key: "requested", label: "Requested", active: true },
    { key: "review", label: "Provider reviewing", active: ["pending", "accepted", "rejected", "cancelled", "in-progress", "completed"].includes(booking.status) },
    {
      key: "approved",
      label: booking.status === "rejected" ? "Rejected" : booking.status === "cancelled" ? "Cancelled" : "Approved",
      active: ["accepted", "rejected", "cancelled", "in-progress", "payment-pending", "completed"].includes(booking.status),
    },
    {
      key: "time",
      label: "Time confirmed",
      active:
        booking.status === "accepted" &&
        booking.scheduleChangeStatus !== "pending" ||
        ["in-progress", "payment-pending", "completed"].includes(booking.status),
    },
    { key: "progress", label: "In progress", active: ["in-progress", "payment-pending", "completed"].includes(booking.status) },
    { key: "payment", label: "Payment", active: ["payment-pending", "completed"].includes(booking.status) || booking.paymentStatus === "paid" },
    { key: "completed", label: "Completed", active: booking.status === "completed" },
  ];

  return steps;
};

const escapeReceiptText = (value) =>
  String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const openReceiptWindow = (booking) => {
  const receiptWindow = window.open("", "_blank", "width=900,height=900");

  if (!receiptWindow) {
    toast.error("Please allow pop-ups to download the receipt.");
    return;
  }

  const serviceTitle = escapeReceiptText(booking.serviceId?.title || "Service booking");
  const customerName = escapeReceiptText(booking.customerName || booking.userId?.name || "-");
  const providerName = escapeReceiptText(booking.providerId?.name || "-");
  const visitDate = escapeReceiptText(booking.providerScheduledDate || booking.date || "-");
  const visitTime = escapeReceiptText(booking.providerScheduledTime || booking.time || "-");
  const paymentMethod = escapeReceiptText(
    booking.paymentMethod === "cash"
      ? "Cash"
      : booking.paymentMethod === "company-qr"
        ? "Online payment"
        : "-"
  );
  const paymentStatus = escapeReceiptText(
    booking.paymentStatus === "paid" ? "Paid" : booking.paymentStatus || "-"
  );
  const address = escapeReceiptText(booking.address || "-");
  const bookingStatus = escapeReceiptText(booking.status || "-");
  const bookingId = escapeReceiptText(booking._id || "-");
  const invoiceNumber = escapeReceiptText(getInvoiceNumber(booking));
  const providerNote = booking.providerScheduleNote
    ? `<div class="detail-row"><span>Provider note</span><strong>${escapeReceiptText(booking.providerScheduleNote)}</strong></div>`
    : "";
  const problemDetails = booking.notes
    ? `<div class="detail-row"><span>Problem details</span><strong>${escapeReceiptText(booking.notes)}</strong></div>`
    : "";

  const receiptHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ServiceBuddy Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f7f1ea;
            color: #11212d;
            margin: 0;
            padding: 32px;
          }
          .receipt {
            max-width: 720px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 28px;
            padding: 34px;
            box-shadow: 0 24px 60px rgba(17, 33, 45, 0.08);
          }
          .brand {
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #dd7d54;
          }
          h1 {
            margin: 12px 0 8px;
            font-size: 32px;
          }
          .muted {
            color: rgba(17, 33, 45, 0.65);
            line-height: 1.7;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 24px;
          }
          .card {
            background: #f7f1ea;
            border-radius: 20px;
            padding: 18px 20px;
          }
          .meta {
            margin-top: 18px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          .pill {
            padding: 10px 14px;
            border-radius: 999px;
            background: #eef6ef;
            color: #1f7a38;
            font-size: 13px;
            font-weight: 700;
          }
          .label {
            font-size: 13px;
            color: rgba(17, 33, 45, 0.58);
            margin-bottom: 8px;
          }
          .value {
            font-size: 18px;
            font-weight: 700;
          }
          .section {
            margin-top: 24px;
            padding: 22px;
            background: #f7f1ea;
            border-radius: 22px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            margin: 14px 0;
            line-height: 1.7;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(17, 33, 45, 0.08);
          }
          .detail-row:last-child {
            border-bottom: 0;
            padding-bottom: 0;
          }
          .detail-row span {
            color: rgba(17, 33, 45, 0.62);
            min-width: 140px;
          }
          .detail-row strong {
            color: #11212d;
            text-align: right;
            font-weight: 600;
          }
          .status {
            display: inline-block;
            margin-top: 18px;
            padding: 12px 18px;
            border-radius: 999px;
            background: #e8f5eb;
            color: #1f7a38;
            font-weight: 700;
          }
          .actions {
            margin-top: 28px;
            display: flex;
            gap: 12px;
          }
          .btn {
            border: 0;
            border-radius: 999px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }
          .btn-dark {
            background: #11212d;
            color: #ffffff;
          }
          .btn-light {
            background: #ffffff;
            color: #11212d;
            border: 1px solid rgba(17, 33, 45, 0.12);
          }
          @media print {
            body {
              background: #ffffff;
              padding: 0;
            }
            .receipt {
              box-shadow: none;
              border-radius: 0;
              max-width: none;
            }
            .actions {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="brand">ServiceBuddy Receipt</div>
          <h1>${serviceTitle}</h1>
          <p class="muted">This receipt includes only the selected completed booking, so the full page is not printed.</p>

          <div class="meta">
            <div class="pill">Receipt ready</div>
            <div class="pill">Invoice: ${invoiceNumber}</div>
            <div class="pill">Booking ID: ${bookingId}</div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="label">Customer</div>
              <div class="value">${customerName}</div>
            </div>
            <div class="card">
              <div class="label">Provider</div>
              <div class="value">${providerName}</div>
            </div>
            <div class="card">
              <div class="label">Visit date</div>
              <div class="value">${visitDate}</div>
            </div>
            <div class="card">
              <div class="label">Visit time</div>
              <div class="value">${visitTime}</div>
            </div>
            <div class="card">
              <div class="label">Payment method</div>
              <div class="value">${paymentMethod}</div>
            </div>
            <div class="card">
              <div class="label">Payment status</div>
              <div class="value">${paymentStatus}</div>
            </div>
          </div>

          <div class="section">
            <div class="detail-row"><span>Address</span><strong>${address}</strong></div>
            <div class="detail-row"><span>Booking status</span><strong>${bookingStatus}</strong></div>
            <div class="detail-row"><span>Invoice number</span><strong>${invoiceNumber}</strong></div>
            <div class="detail-row"><span>Support number</span><strong>${SUPPORT_NUMBER}</strong></div>
            ${providerNote}
            ${problemDetails}
          </div>

          <div class="status">Booking completed successfully</div>

          <div class="actions">
            <button class="btn btn-dark" onclick="window.print()">Print receipt</button>
            <button class="btn btn-light" onclick="window.close()">Close</button>
          </div>
        </div>
        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 250);
          };
          window.onafterprint = function () {
            window.close();
          };
        </script>
      </body>
    </html>
  `;

  receiptWindow.document.open();
  receiptWindow.document.write(receiptHtml);
  receiptWindow.document.close();
};

const BookingsPage = () => {
  const { user } = useAuth();
  const socket = useSocket(user?._id);
  const [bookings, setBookings] = useState([]);
  const [reviewData, setReviewData] = useState({ bookingId: "", rating: 5, comment: "" });
  const [messages, setMessages] = useState({});
  const [chatText, setChatText] = useState({});
  const [activeChatBookingId, setActiveChatBookingId] = useState("");
  const [messageNotifications, setMessageNotifications] = useState({});
  const [cancelReasonByBooking, setCancelReasonByBooking] = useState({});

  const fetchBookings = async () => {
    const { data } = await api.get("/bookings");
    setBookings(data);
    setMessageNotifications(
      Object.fromEntries(data.map((booking) => [booking._id, booking.unreadMessageCount || 0]))
    );
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleUpdate = (booking) => {
      setBookings((prev) => {
        const exists = prev.find((item) => item._id === booking._id);
        if (!exists) {
          return [booking, ...prev];
        }
        return prev.map((item) => (item._id === booking._id ? booking : item));
      });
    };

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

    socket.on("booking:update", handleUpdate);
    socket.on("booking:new", handleUpdate);
    socket.on("chat:new", handleIncomingMessage);

    return () => {
      socket.off("booking:update", handleUpdate);
      socket.off("booking:new", handleUpdate);
      socket.off("chat:new", handleIncomingMessage);
    };
  }, [activeChatBookingId, socket]);

  const openChat = async (bookingId) => {
    if (activeChatBookingId === bookingId) {
      setActiveChatBookingId("");
      return;
    }

    const { data } = await api.get(`/chat/${bookingId}`);
    setMessages((prev) => ({ ...prev, [bookingId]: data }));
    setActiveChatBookingId(bookingId);
    setMessageNotifications((prev) => ({ ...prev, [bookingId]: 0 }));
    setBookings((prev) =>
      prev.map((booking) =>
        booking._id === bookingId ? { ...booking, unreadMessageCount: 0 } : booking
      )
    );
  };

  const sendMessage = async (bookingId) => {
    if (!chatText[bookingId]) {
      return;
    }

    await api.post("/chat", {
      bookingId,
      text: chatText[bookingId],
    });

    setChatText((prev) => ({ ...prev, [bookingId]: "" }));
    const { data } = await api.get(`/chat/${bookingId}`);
    setMessages((prev) => ({ ...prev, [bookingId]: data }));
    setActiveChatBookingId(bookingId);
    setMessageNotifications((prev) => ({ ...prev, [bookingId]: 0 }));
    setBookings((prev) =>
      prev.map((booking) =>
        booking._id === bookingId ? { ...booking, unreadMessageCount: 0 } : booking
      )
    );
  };

  const totalUnreadMessages = Object.values(messageNotifications).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    window.localStorage.setItem("userUnreadMessages", String(totalUnreadMessages));
    window.dispatchEvent(new CustomEvent("user-unread-updated", { detail: totalUnreadMessages }));
  }, [totalUnreadMessages]);

  const submitReview = async () => {
    try {
      await api.post("/reviews", reviewData);
      toast.success("Review submitted");
      setReviewData({ bookingId: "", rating: 5, comment: "" });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const updateStatus = async (bookingId, status) => {
    await api.patch(`/bookings/${bookingId}/status`, { status });
    toast.success("Booking updated");
    await fetchBookings();
  };

  const confirmProviderTime = async (bookingId, scheduleChangeStatus) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { scheduleChangeStatus });
      toast.success(
        scheduleChangeStatus === "accepted" ? "New provider time accepted" : "New provider time rejected"
      );
      await fetchBookings();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const cancelReason = String(cancelReasonByBooking[bookingId] || "").trim();

      if (!cancelReason) {
        toast.error("Please select or enter a cancel reason first");
        return;
      }

      await api.patch(`/bookings/${bookingId}/status`, {
        status: "cancelled",
        userCancelReason: cancelReason,
      });
      toast.success("Booking cancelled");
      await fetchBookings();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteBookingHistory = async (bookingId) => {
    try {
      await api.delete(`/bookings/${bookingId}`);
      setBookings((prev) => prev.filter((booking) => booking._id !== bookingId));
      setMessages((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
      setMessageNotifications((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
      if (activeChatBookingId === bookingId) {
        setActiveChatBookingId("");
      }
      toast.success("Booking history deleted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-ink">Bookings</h1>
            <p className="mt-2 text-sm text-ink/65">
              Track request status, share updates, and submit reviews after service completion.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Pending", bookings.filter((booking) => booking.status === "pending").length],
            ["Approved", bookings.filter((booking) => booking.status === "accepted").length],
            ["Completed", bookings.filter((booking) => booking.status === "completed").length],
            ["Notifications", totalUnreadMessages],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.5rem] bg-white p-5 shadow-soft">
              <p className="text-sm text-ink/60">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6">
          {bookings.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-10 text-center shadow-soft">
              <h2 className="text-2xl font-semibold text-ink">No booking history yet</h2>
              <p className="mt-3 text-sm leading-7 text-ink/65">
                Your requested services, approvals, payments, receipts, and reviews will appear here after you place your first booking.
              </p>
            </div>
          ) : bookings.map((booking) => (
            <div key={booking._id} className="rounded-[1.75rem] bg-white p-6 shadow-soft">
              <div className="flex flex-col justify-between gap-4 lg:flex-row">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                    {formatBookingStatusLabel(booking)}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">{booking.serviceId?.title}</h3>
                  <p className="mt-2 text-sm text-ink/65">
                    Date: {booking.date} at {booking.time}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {timelineSteps(booking).map((step) => (
                      <span
                        key={step.key}
                        className={`rounded-full px-3 py-2 text-xs font-semibold ${
                          step.active
                            ? "bg-ink text-white"
                            : "bg-sand text-ink/55"
                        }`}
                      >
                        {step.label}
                      </span>
                    ))}
                  </div>
                  {(booking.providerScheduledDate || booking.providerScheduledTime || booking.providerScheduleNote) && (
                    <div className="mt-3 rounded-2xl bg-sand px-4 py-3 text-sm text-ink/70">
                      <p className="font-semibold text-ink">Provider timing update</p>
                      <p className="mt-1">
                        Visit date: {booking.providerScheduledDate || booking.date}
                      </p>
                      <p>Visit time: {booking.providerScheduledTime || booking.time}</p>
                      {booking.providerScheduleNote && <p className="mt-1">{booking.providerScheduleNote}</p>}
                      {booking.scheduleChangeStatus === "pending" && (
                        <p className="mt-2 font-semibold text-brand">
                          Provider requested a different visit time. Please confirm yes or no.
                        </p>
                      )}
                    </div>
                  )}
                  <p className="mt-1 text-sm text-ink/65">Address: {booking.address}</p>
                  {booking.status !== "cancelled" && (
                    <div className="mt-3 rounded-2xl bg-sand px-4 py-3 text-sm text-ink/70">
                      <p className="font-semibold text-ink">Company support</p>
                      <p className="mt-1">Support number: {SUPPORT_NUMBER}</p>
                      <p className="mt-1">
                        Our support team will connect you with the provider after booking updates.
                      </p>
                    </div>
                  )}
                  <p className="mt-1 text-sm text-ink/65">
                    {user?.role === "provider" ? "Customer" : "Provider"}:{" "}
                    {user?.role === "provider" ? booking.userId?.name : booking.providerId?.name}
                  </p>
                  {booking.status === "pending" && (
                    <p className="mt-3 rounded-full bg-sand px-4 py-2 text-sm text-ink/70 inline-block">
                      {user?.role === "provider"
                        ? "This request is waiting for your approval."
                        : "Your request is waiting for provider approval."}
                    </p>
                  )}
                  {booking.status === "accepted" && (
                    <p className="mt-3 rounded-full bg-[#e8f5eb] px-4 py-2 text-sm text-[#1f7a38] inline-block">
                      {booking.scheduleChangeStatus === "pending"
                        ? "Provider changed the timing. Please confirm the new time."
                        : "Approved. Chat is now available."}
                    </p>
                  )}
                  {booking.status === "in-progress" && (
                    <p className="mt-3 rounded-full bg-[#fff3e8] px-4 py-2 text-sm text-[#b54708] inline-block">
                      Work is in progress. Payment will unlock after the provider submits work proof.
                    </p>
                  )}
                  {booking.status === "payment-pending" && booking.paymentStatus !== "paid" && (
                    <p className="mt-3 rounded-full bg-[#fff3e8] px-4 py-2 text-sm text-[#b54708] inline-block">
                      The provider has submitted work proof to the company. Payment is being handled by the provider and company.
                    </p>
                  )}
                  {booking.status === "completed" && booking.paymentStatus === "paid" && (
                    <p className="mt-3 rounded-full bg-[#e8f5eb] px-4 py-2 text-sm text-[#1f7a38] inline-block">
                      Payment received. Booking completed successfully.
                    </p>
                  )}
                  {booking.status === "rejected" && (
                    <div className="mt-3 rounded-2xl bg-[#fdeaea] px-4 py-3 text-sm text-[#b42318] inline-block">
                      <p>Rejected by provider.</p>
                      {booking.providerRejectReason && <p className="mt-1">{booking.providerRejectReason}</p>}
                    </div>
                  )}
                  {booking.status === "cancelled" && (
                    <div className="mt-3 rounded-2xl bg-[#fdeaea] px-4 py-3 text-sm text-[#b42318] inline-block">
                      <p>Booking cancelled.</p>
                      {booking.userCancelReason && <p className="mt-1">{booking.userCancelReason}</p>}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {user?.role === "user" && booking.paymentStatus === "paid" && (
                    <span className="rounded-full bg-[#e8f5eb] px-6 py-3 text-sm font-semibold text-[#1f7a38]">
                      Paid via {booking.paymentMethod === "cash" ? "cash" : "online payment"}
                    </span>
                  )}
                  {user?.role === "user" && ["completed", "cancelled", "rejected"].includes(booking.status) && (
                    <button
                      type="button"
                      className="rounded-full bg-[#11212d] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                      onClick={() => deleteBookingHistory(booking._id)}
                    >
                      Delete history
                    </button>
                  )}
                  {user?.role === "user" && !["completed", "cancelled", "rejected"].includes(booking.status) && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        className="input min-w-[16rem]"
                        placeholder="Cancel reason"
                        list={`cancel-reasons-${booking._id}`}
                        value={cancelReasonByBooking[booking._id] || ""}
                        onChange={(e) =>
                          setCancelReasonByBooking((prev) => ({ ...prev, [booking._id]: e.target.value }))
                        }
                      />
                      <datalist id={`cancel-reasons-${booking._id}`}>
                        {cancelReasonSuggestions.map((reason) => (
                          <option key={reason} value={reason} />
                        ))}
                      </datalist>
                      <button
                        type="button"
                        className="rounded-full bg-[#fdeaea] px-6 py-3 text-sm font-semibold text-[#b42318] transition hover:bg-[#f9d5d3]"
                        disabled={!String(cancelReasonByBooking[booking._id] || "").trim()}
                        onClick={() => cancelBooking(booking._id)}
                      >
                        Cancel booking
                      </button>
                    </div>
                  )}
                  {user?.role === "user" &&
                    booking.status === "accepted" &&
                    booking.scheduleChangeStatus === "pending" && (
                      <>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => confirmProviderTime(booking._id, "accepted")}
                        >
                          Accept new time
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => confirmProviderTime(booking._id, "rejected")}
                        >
                          Reject new time
                        </button>
                      </>
                    )}
                  {user?.role === "provider" && booking.status === "pending" && (
                    <>
                      <button type="button" className="btn-primary" onClick={() => updateStatus(booking._id, "accepted")}>
                        Accept
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => updateStatus(booking._id, "rejected")}>
                        Reject
                      </button>
                    </>
                  )}
                  {user?.role === "provider" && booking.status === "accepted" && (
                    <button type="button" className="btn-primary" onClick={() => updateStatus(booking._id, "in-progress")}>
                      Start work
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {["accepted", "in-progress", "payment-pending", "completed"].includes(booking.status) &&
                booking.scheduleChangeStatus !== "pending" ? (
                  <div className="rounded-3xl bg-sand p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold text-ink">Chat</h4>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-sm font-medium text-brand"
                        onClick={() => openChat(booking._id)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        {activeChatBookingId === booking._id ? "Close chat" : "Open chat"}
                        {(messageNotifications[booking._id] || booking.unreadMessageCount) > 0 && (
                          <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">
                            +{messageNotifications[booking._id] || booking.unreadMessageCount}
                          </span>
                        )}
                      </button>
                    </div>
                    {activeChatBookingId === booking._id && (
                      <>
                        <div className="mt-4 max-h-56 space-y-3 overflow-y-auto">
                          {(messages[booking._id] || []).map((message) => (
                            <div key={message._id} className="rounded-2xl bg-white p-3 text-sm text-ink/75">
                              <span className="font-semibold text-brand">{message.senderId?.name}: </span>
                              {message.text}
                              {message.seenAt && (
                                <span className="ml-2 text-xs text-ink/45">Seen</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex gap-3">
                          <input
                            className="input"
                            placeholder="Type a message"
                            value={chatText[booking._id] || ""}
                            onChange={(e) => setChatText((prev) => ({ ...prev, [booking._id]: e.target.value }))}
                          />
                          <button type="button" className="btn-primary" onClick={() => sendMessage(booking._id)}>
                            Send
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-3xl bg-sand p-5">
                    <h4 className="text-lg font-semibold text-ink">Chat</h4>
                    <p className="mt-4 text-sm leading-6 text-ink/65">
                      {booking.scheduleChangeStatus === "pending"
                        ? "Chat will unlock after you confirm the provider's updated timing."
                        : "Chat will unlock only after the provider accepts this request."}
                    </p>
                  </div>
                )}

                {user?.role === "user" && booking.status === "completed" && (
                  <div className="rounded-3xl bg-sand p-5">
                    <h4 className="text-lg font-semibold text-ink">Leave a review</h4>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-3xl bg-white px-4 py-4">
                        <p className="text-sm font-semibold text-ink">Tap to rate</p>
                        <div className="mt-3 flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => {
                            const activeRating =
                              reviewData.bookingId === booking._id ? reviewData.rating : 5;

                            return (
                              <button
                                key={rating}
                                type="button"
                                onClick={() =>
                                  setReviewData({
                                    bookingId: booking._id,
                                    rating,
                                    comment: reviewData.bookingId === booking._id ? reviewData.comment : "",
                                  })
                                }
                                className="transition hover:scale-110"
                              >
                                <Star
                                  className={`h-7 w-7 ${
                                    rating <= activeRating
                                      ? "fill-brand text-brand"
                                      : "text-ink/25"
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <textarea
                        className="input min-h-28"
                        placeholder="Share your experience"
                        value={reviewData.bookingId === booking._id ? reviewData.comment : ""}
                        onChange={(e) =>
                          setReviewData((prev) => ({
                            bookingId: booking._id,
                            rating: prev.bookingId === booking._id ? prev.rating : 5,
                            comment: e.target.value,
                          }))
                        }
                      />
                      <button type="button" className="btn-primary w-full" onClick={submitReview}>
                        Submit review
                      </button>
                      <button
                        type="button"
                        className="btn-secondary w-full"
                        onClick={() => openReceiptWindow(booking)}
                      >
                        Download receipt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </AppLayout>
  );
};

export default BookingsPage;
