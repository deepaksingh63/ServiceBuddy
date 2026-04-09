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

const AdminMarketplaceActivityPage = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const loadBookings = async () => {
      const { data } = await api.get("/admin/dashboard");
      setBookings(data.bookings || []);
    };
    loadBookings();
  }, []);

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="hero-panel p-8 sm:p-10">
          <span className="section-tag">Admin section</span>
          <h1 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">Marketplace activity</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
            Review live platform activity across booking requests, approvals, payments, cancellations, and completed jobs.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <div key={booking._id} className="surface-panel p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                  {formatBookingStatusLabel(booking)}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">{booking.serviceId?.title}</h2>
                <p className="mt-1 text-sm text-ink/65">
                  {booking.userId?.name} with {booking.providerId?.name}
                </p>
                <p className="mt-1 text-sm text-ink/65">
                  Visit date: {booking.providerScheduledDate || booking.date} at {booking.providerScheduledTime || booking.time}
                </p>
                <p className="mt-1 text-sm text-ink/65">Payment status: {booking.paymentStatus}</p>
              </div>
            ))
          ) : (
            <div className="surface-panel p-10 text-center">
              <h2 className="text-2xl font-semibold text-ink">No marketplace activity yet</h2>
              <p className="mt-3 text-sm leading-7 text-ink/65">
                New booking requests and service activity will start appearing here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminMarketplaceActivityPage;
