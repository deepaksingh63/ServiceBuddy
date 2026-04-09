import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import { api, getErrorMessage } from "../api/client";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setResetUrl(data.resetUrl);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-8 shadow-soft">
          <h1 className="text-3xl font-semibold text-ink">Forgot password</h1>
          <p className="mt-2 text-sm text-ink/65">
            Enter your registered email. If SMTP is configured, the reset link will be sent to your inbox.
          </p>
          <div className="mt-8 space-y-5">
            <input
              type="email"
              placeholder="Email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary w-full">
              Generate reset link
            </button>
          </div>

          {resetUrl && (
            <div className="mt-6 rounded-3xl bg-sand p-5">
              <p className="text-sm font-semibold text-brand">Reset link ready</p>
              <a href={resetUrl} className="mt-3 block break-all text-sm text-ink underline">
                {resetUrl}
              </a>
            </div>
          )}

          <p className="mt-6 text-sm text-ink/65">
            Remembered your password? <Link to="/login" className="font-semibold text-brand">Back to login</Link>
          </p>
        </form>
      </div>
    </AppLayout>
  );
};

export default ForgotPasswordPage;
