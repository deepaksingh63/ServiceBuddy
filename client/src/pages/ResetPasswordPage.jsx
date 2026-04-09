import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import { api, getErrorMessage } from "../api/client";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, {
        password: formData.password,
      });
      toast.success(data.message);
      navigate("/login");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-8 shadow-soft">
          <h1 className="text-3xl font-semibold text-ink">Reset password</h1>
          <p className="mt-2 text-sm text-ink/65">Set a new password and log in again.</p>
          <div className="mt-8 space-y-5">
            <input
              type="password"
              placeholder="New password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="input"
              value={formData.confirmPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
            <button type="submit" className="btn-primary w-full">
              Reset password
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default ResetPasswordPage;
