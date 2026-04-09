import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppLayout from "../../layouts/AppLayout";
import { api } from "../../api/client";

const AdminUsersOverviewPage = () => {
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    const { data } = await api.get("/admin/dashboard");
    setUsers(data.users || []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateRole = async (userId, role) => {
    await api.patch(`/admin/users/${userId}/role`, { role });
    toast.success("User role updated");
    await loadUsers();
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="hero-panel p-8 sm:p-10">
          <span className="section-tag">Admin section</span>
          <h1 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">Users overview</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
            Manage user roles, review signups, and monitor the current account mix across customers, providers, and admins.
          </p>
        </div>

        <div className="surface-panel mt-10 p-6">
          <div className="overflow-x-auto">
            <table className="data-table min-w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Change role</th>
                  <th className="pb-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => (
                  <tr key={entry._id} className="border-t border-ink/10">
                    <td className="py-3 text-ink">{entry.name}</td>
                    <td className="py-3 text-ink/70">{entry.email}</td>
                    <td className="py-3 text-ink/70">{entry.role}</td>
                    <td className="py-3 text-ink/70">
                      <select
                        className="rounded-xl border border-ink/10 bg-white px-3 py-2"
                        value={entry.role}
                        onChange={(e) => updateRole(entry._id, e.target.value)}
                      >
                        <option value="user">user</option>
                        <option value="provider">provider</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-3 text-ink/70">{new Date(entry.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="surface-muted p-8 text-center">
              <p className="text-xl font-semibold text-ink">No users found</p>
              <p className="mt-3 text-sm leading-7 text-ink/65">
                Registered accounts will appear here when people start joining the platform.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminUsersOverviewPage;
