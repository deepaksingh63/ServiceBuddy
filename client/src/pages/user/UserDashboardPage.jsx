import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const HELP_LINE_NUMBER = "+91 98765 43210";

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

const UserDashboardPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const loadBookings = async () => {
      const { data } = await api.get("/bookings");
      setBookings(data);
    };

    loadBookings();
  }, []);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === "pending").length,
      approved: bookings.filter((booking) => ["accepted", "in-progress", "completed"].includes(booking.status)).length,
      completed: bookings.filter((booking) => booking.status === "completed").length,
      rejected: bookings.filter((booking) => booking.status === "rejected").length,
    };
  }, [bookings]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">User details</p>
            <h1 className="mt-3 text-4xl font-semibold text-ink">{user?.name}</h1>
            <div className="mt-6 space-y-3 text-sm text-ink/70">
              <p><span className="font-semibold text-ink">Email:</span> {user?.email}</p>
              <p><span className="font-semibold text-ink">Phone:</span> {user?.phone || "Not added"}</p>
              <p><span className="font-semibold text-ink">Role:</span> User</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total Bookings", stats.total],
              ["Pending", stats.pending],
              ["Approved", stats.approved],
              ["Completed", stats.completed],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.5rem] bg-white p-6 shadow-soft">
                <p className="text-sm text-ink/60">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-[1.75rem] bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">Booking dashboard</h2>
              <p className="mt-2 text-sm text-ink/65">
                Track all booked services here, including pending, approved, completed, and rejected requests.
              </p>
            </div>
            <div className="rounded-full bg-sand px-4 py-2 text-sm text-ink/70">
              Rejected: {stats.rejected}
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="rounded-3xl bg-sand p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                      {formatBookingStatusLabel(booking)}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-ink">{booking.serviceId?.title}</h3>
                    <p className="mt-2 text-sm text-ink/65">Provider: {booking.providerId?.name}</p>
                    <p className="mt-1 text-sm text-ink/65">Date: {booking.date} at {booking.time}</p>
                    {(booking.providerScheduledDate || booking.providerScheduledTime || booking.providerScheduleNote) && (
                      <p className="mt-1 text-sm text-ink/65">
                        Provider timing: {booking.providerScheduledDate || booking.date} at{" "}
                        {booking.providerScheduledTime || booking.time}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-ink/65">Address: {booking.address}</p>
                  </div>
                  <div className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-ink">
                    {formatBookingStatusLabel(booking)}
                  </div>
                </div>

                {["accepted", "in-progress", "completed"].includes(booking.status) && (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link
                      to="/bookings"
                      className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
                    >
                      Open Chat
                    </Link>
                    <div className="rounded-full bg-white px-4 py-3 text-sm text-ink/80">
                      Help line: {HELP_LINE_NUMBER}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {bookings.length === 0 && (
              <div className="rounded-3xl bg-sand p-8 text-center">
                <p className="text-xl font-semibold text-ink">No bookings found yet</p>
                <p className="mt-3 text-sm leading-7 text-ink/65">
                  Start exploring services and your dashboard will show booking progress, payment steps, and completed jobs here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default UserDashboardPage;
