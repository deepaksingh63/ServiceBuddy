import { useEffect, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { api } from "../../api/client";

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

const getAssetUrl = (fileUrl) => {
  if (!fileUrl) {
    return "";
  }

  if (fileUrl.startsWith("http")) {
    return fileUrl;
  }

  return `${api.defaults.baseURL.replace(/\/api$/, "")}${fileUrl}`;
};

const AdminNotificationsPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [expandedNotificationId, setExpandedNotificationId] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const { data } = await api.get("/admin/dashboard");
      setDashboard(data);
    };

    loadDashboard();
  }, []);

  if (!dashboard) {
    return <AppLayout><div className="p-10 text-center text-ink">Loading admin notifications...</div></AppLayout>;
  }

  const adminNotifications = dashboard.bookings
    .filter(
      (booking) =>
        (booking.completionProof?.fileUrl && ["payment-pending", "completed"].includes(booking.status)) ||
        (booking.status === "cancelled" && booking.userCancelReason)
    )
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="hero-panel flex flex-wrap items-center justify-between gap-4 p-8 sm:p-10">
          <div>
            <span className="section-tag">Providers history</span>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold text-white sm:text-5xl">Completed work proof and cancellation records</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
              Open each record to view provider work proof, completion location, or customer cancellation reasons.
            </p>
          </div>
          <div className="metric-card bg-white px-6 py-5">
            <p className="text-sm text-ink/60">Total provider records</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{adminNotifications.length}</p>
          </div>
        </div>

        <div className="mt-10 space-y-4">
          {adminNotifications.length > 0 ? (
            adminNotifications.map((booking) => (
              <div key={booking._id} className="surface-panel p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                      {booking.status === "cancelled" ? "User cancelled booking" : "Work proof submitted"}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-ink">{booking.serviceId?.title}</h2>
                    <p className="mt-1 text-sm text-ink/65">
                      Customer: {booking.userId?.name} | Provider: {booking.providerId?.name}
                    </p>
                    <p className="mt-1 text-sm text-ink/65">
                      Status: {formatBookingStatusLabel(booking)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal"
                    onClick={() =>
                      setExpandedNotificationId((prev) => (prev === booking._id ? "" : booking._id))
                    }
                  >
                    {expandedNotificationId === booking._id ? "Close details" : "Open details"}
                  </button>
                </div>

                {expandedNotificationId === booking._id && (
                  <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      {booking.status === "cancelled" ? (
                        <div className="surface-muted p-5 text-sm text-ink/75">
                          <p className="font-semibold text-ink">Cancel reason</p>
                          <p className="mt-2">{booking.userCancelReason}</p>
                        </div>
                      ) : (
                        <div className="surface-muted p-5 text-sm text-ink/75">
                          <p className="font-semibold text-ink">Completion details</p>
                          <p className="mt-2">
                            Location: {booking.completionLocation?.address || "Provider location not available"}
                          </p>
                          <p className="mt-2">
                            Submitted on {new Date(booking.updatedAt || booking.createdAt).toLocaleString()}
                          </p>
                          <p className="mt-2">
                            Payment collected: Rs. {booking.totalAmount || 0}
                          </p>
                          <p className="mt-2">
                            Payment method:{" "}
                            {booking.paymentMethod === "cash"
                              ? "Cash"
                              : booking.paymentMethod === "company-qr"
                                ? "Online"
                                : booking.paymentMethod || "Not recorded"}
                          </p>
                          <p className="mt-2">
                            Payment status: {booking.paymentStatus === "paid" ? "Paid" : booking.paymentStatus}
                          </p>
                        </div>
                      )}
                    </div>

                    {booking.completionProof?.fileUrl ? (
                      <div className="w-full max-w-xs">
                        {booking.completionProof?.mimeType?.startsWith("image/") ? (
                          <img
                            src={getAssetUrl(booking.completionProof.fileUrl)}
                            alt="Work completion proof"
                            className="max-h-64 w-full rounded-3xl object-cover bg-white shadow-[0_18px_45px_rgba(17,33,45,0.08)]"
                          />
                        ) : (
                          <a
                            href={getAssetUrl(booking.completionProof.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand shadow-[0_12px_28px_rgba(17,33,45,0.08)]"
                          >
                            Open work proof
                          </a>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="surface-panel p-10 text-center">
              <h2 className="text-2xl font-semibold text-ink">No admin alerts right now</h2>
              <p className="mt-3 text-sm leading-7 text-ink/65">
                Provider work proof submissions and customer cancellation updates will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminNotificationsPage;
