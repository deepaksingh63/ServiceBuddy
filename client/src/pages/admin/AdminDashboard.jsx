import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { api } from "../../api/client";

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      const { data } = await api.get("/admin/dashboard");
      setDashboard(data);
    };

    loadDashboard();
  }, []);

  if (!dashboard) {
    return <AppLayout><div className="p-10 text-center text-ink">Loading admin panel...</div></AppLayout>;
  }

  const { stats, providers, bookings, adminActions = [] } = dashboard;
  const adminNotificationsCount = bookings.filter(
    (booking) =>
      (booking.completionProof?.fileUrl && ["payment-pending", "completed"].includes(booking.status)) ||
      (booking.status === "cancelled" && booking.userCancelReason)
  ).length;

  const sectionCards = [
    {
      title: "Provider approvals",
      description: "Review provider profiles, inspect uploaded documents, and approve or revoke marketplace access.",
      metric: providers.length,
      metricLabel: "Provider profiles",
      href: "/admin/providers",
    },
    {
      title: "Marketplace activity",
      description: "Track all booking flow activity including approvals, progress, payments, and completions.",
      metric: bookings.length,
      metricLabel: "Booking records",
      href: "/admin/activity",
    },
    {
      title: "Users overview",
      description: "Manage account roles and review all registered users from one clean page.",
      metric: stats.totalUsers + stats.totalProviders,
      metricLabel: "Accounts",
      href: "/admin/users",
    },
    {
      title: "Providers history",
      description: "Open completed work proof submissions, provider job records, and customer cancellation alerts.",
      metric: adminNotificationsCount,
      metricLabel: "Alerts",
      href: "/admin/notifications",
    },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="hero-panel p-8 sm:p-10">
          <span className="section-tag">Control center</span>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold text-white sm:text-5xl">Admin panel</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
            Manage provider onboarding, marketplace activity, account roles, and provider-side job records from one premium control hub.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            ["Users", stats.totalUsers],
            ["Providers", stats.totalProviders],
            ["Approved", stats.approvedProviders],
            ["Bookings", stats.totalBookings],
            ["Revenue", `Rs. ${stats.totalRevenue}`],
          ].map(([label, value], index) => (
            <div key={label} className={`${index === 4 ? "metric-card-dark" : "metric-card"} p-6`}>
              <p className={`text-sm ${index === 4 ? "text-white/70" : "text-ink/60"}`}>{label}</p>
              <p className={`mt-3 text-3xl font-semibold ${index === 4 ? "text-white" : "text-ink"}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="surface-panel mt-6 p-6">
          <h2 className="text-2xl font-semibold text-ink">Analytics snapshot</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {[
              ["Approval rate", `${stats.totalProviders ? Math.round((stats.approvedProviders / stats.totalProviders) * 100) : 0}%`],
              ["Revenue status", stats.totalRevenue > 0 ? "Growing" : "Pending"],
              ["Booking traffic", stats.totalBookings > 10 ? "High" : "Normal"],
              ["Provider trust", stats.approvedProviders > 0 ? "Verified" : "Needs review"],
            ].map(([label, value]) => (
              <div key={label} className="surface-muted p-5">
                <p className="text-sm text-ink/60">{label}</p>
                <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {sectionCards.map((section) => (
            <div key={section.title} className="admin-link-card p-6">
              <h2 className="text-2xl font-semibold text-ink">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-ink/65">{section.description}</p>
              <div className="surface-muted mt-5 flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-ink/60">{section.metricLabel}</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{section.metric}</p>
                </div>
                <Link to={section.href} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal">
                  Open page
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="surface-panel mt-10 p-6">
          <h2 className="text-2xl font-semibold text-ink">Recent admin actions</h2>
          <div className="mt-5 space-y-4">
            {adminActions.length > 0 ? (
              adminActions.map((action) => (
                <div key={action._id} className="surface-muted p-4">
                  <p className="text-sm font-semibold text-brand">
                    {action.actionType === "provider-approved"
                      ? "Provider approved"
                      : action.actionType === "provider-revoked"
                        ? "Approval revoked"
                        : "Role updated"}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">{action.targetName}</p>
                  <p className="mt-1 text-sm text-ink/65">{action.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/45">
                    Updated {new Date(action.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-3xl bg-sand p-4 text-sm text-ink/65">
                No recent admin actions yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
