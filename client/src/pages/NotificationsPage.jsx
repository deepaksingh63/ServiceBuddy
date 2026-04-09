import { useEffect, useMemo, useState } from "react";
import { BellRing, MessageCircleMore, ShieldCheck, Sparkles } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const formatStatusLabel = (booking) => {
  if (booking.status === "pending") return "Pending request";
  if (booking.status === "accepted") return booking.scheduleChangeStatus === "pending" ? "Timing confirmation pending" : "Approved";
  if (booking.status === "payment-pending") return "Payment pending";
  if (booking.status === "in-progress") return "In progress";
  if (booking.status === "completed") return "Completed";
  if (booking.status === "rejected") return "Rejected";
  if (booking.status === "cancelled") return "Cancelled";
  return booking.status || "Update";
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) {
        setItems([]);
        return;
      }

      if (user.role === "admin") {
        const { data } = await api.get("/admin/dashboard");
        const pendingProviders = data.providers.filter((provider) => !provider.providerProfile?.isApproved);
        const adminItems = [
          ...pendingProviders.slice(0, 5).map((provider) => ({
            id: `provider-${provider._id}`,
            title: "Provider approval pending",
            body: `${provider.name} is waiting for admin verification.`,
            time: provider.createdAt,
            tone: "amber",
          })),
          ...(data.adminActions || []).map((action) => ({
            id: `action-${action._id}`,
            title: "Admin activity",
            body: action.message,
            time: action.createdAt,
            tone: "ink",
          })),
        ].sort((a, b) => new Date(b.time) - new Date(a.time));

        setItems(adminItems);
        return;
      }

      const { data } = await api.get("/bookings");
      const bookingItems = data.flatMap((booking) => {
        const result = [];

        if (booking.unreadMessageCount > 0) {
          result.push({
            id: `${booking._id}-messages`,
            title: "New chat messages",
            body: `${booking.unreadMessageCount} unread message${booking.unreadMessageCount > 1 ? "s" : ""} in ${booking.serviceId?.title}.`,
            time: booking.updatedAt || booking.createdAt,
            tone: "brand",
          });
        }

        if (user.role === "user" && booking.scheduleChangeStatus === "pending") {
          result.push({
            id: `${booking._id}-timing`,
            title: "Provider sent a timing update",
            body: `Please confirm the new timing for ${booking.serviceId?.title}.`,
            time: booking.updatedAt || booking.createdAt,
            tone: "amber",
          });
        }

        if (user.role === "provider" && booking.status === "pending") {
          result.push({
            id: `${booking._id}-request`,
            title: "New booking request",
            body: `${booking.userId?.name || "A customer"} requested ${booking.serviceId?.title}.`,
            time: booking.createdAt,
            tone: "brand",
          });
        }

        if (booking.status === "payment-pending") {
          result.push({
            id: `${booking._id}-payment`,
            title: "Payment step open",
            body:
              user.role === "provider"
                ? `Collect payment for ${booking.serviceId?.title} to finish the booking.`
                : `${booking.serviceId?.title} is in the payment step.`,
            time: booking.updatedAt || booking.createdAt,
            tone: "amber",
          });
        }

        if (["completed", "rejected", "cancelled"].includes(booking.status)) {
          result.push({
            id: `${booking._id}-status`,
            title: "Booking updated",
            body: `${booking.serviceId?.title} is now marked as ${formatStatusLabel(booking).toLowerCase()}.`,
            time: booking.updatedAt || booking.createdAt,
            tone: booking.status === "completed" ? "green" : "ink",
          });
        }

        return result;
      });

      const accountItems = [];
      if (user.role === "provider" && user.providerProfile?.approvalMessage) {
        accountItems.push({
          id: "provider-approval-message",
          title: user.providerProfile?.isApproved ? "Provider profile approved" : "Provider profile update",
          body: user.providerProfile.approvalMessage,
          time: user.updatedAt || new Date().toISOString(),
          tone: user.providerProfile?.isApproved ? "green" : "amber",
        });
      }

      const combined = [...accountItems, ...bookingItems].sort(
        (a, b) => new Date(b.time) - new Date(a.time)
      );
      setItems(combined);
    };

    loadNotifications();
  }, [user]);

  const summary = useMemo(
    () => ({
      total: items.length,
      unreadChats: items.filter((item) => item.title === "New chat messages").length,
      actions: items.filter((item) => item.title !== "New chat messages").length,
    }),
    [items]
  );

  const toneStyles = {
    brand: "bg-[#fff1e9] text-brand",
    amber: "bg-[#fff4e7] text-[#b54708]",
    green: "bg-[#e8f5eb] text-[#1f7a38]",
    ink: "bg-sand text-ink",
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Notification center</p>
            <h1 className="mt-3 text-4xl font-semibold text-ink">All important updates in one place</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/65">
              Track booking updates, payment steps, chat alerts, provider approvals, and admin actions without checking every page separately.
            </p>
          </div>
          <div className="rounded-[1.75rem] bg-white p-5 shadow-soft">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Total</p>
                <p className="mt-2 text-2xl font-semibold text-ink">{summary.total}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Chats</p>
                <p className="mt-2 text-2xl font-semibold text-ink">{summary.unreadChats}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Updates</p>
                <p className="mt-2 text-2xl font-semibold text-ink">{summary.actions}</p>
              </div>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-[2rem] bg-white p-10 text-center shadow-soft">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sand text-brand">
              <BellRing className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-ink">No notifications right now</h2>
            <p className="mt-3 text-sm leading-7 text-ink/65">
              New chat messages, booking changes, payment steps, and account updates will appear here as soon as they happen.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-[1.75rem] bg-white p-5 shadow-soft">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneStyles[item.tone] || toneStyles.ink}`}>
                      {item.title === "New chat messages" ? (
                        <MessageCircleMore className="h-5 w-5" />
                      ) : item.title.includes("Admin") ? (
                        <ShieldCheck className="h-5 w-5" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-ink">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-ink/70">{item.body}</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                    {new Date(item.time).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default NotificationsPage;
