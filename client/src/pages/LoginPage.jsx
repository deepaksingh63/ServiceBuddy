import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const user = await login(formData);
    navigate(user.role === "admin" ? "/admin" : user.role === "provider" ? "/provider" : "/services");
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-8 shadow-soft">
          <h1 className="text-3xl font-semibold text-ink">Login</h1>
          <p className="mt-2 text-sm text-ink/65">Access your user, provider, or admin account.</p>
          <p className="mt-3 text-sm text-ink/70">
            Do not have an account?{" "}
            <Link to="/register" className="font-semibold text-brand">
              Join now
            </Link>
          </p>
          <div className="mt-8 space-y-5">
            <input
              type="email"
              placeholder="Email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm font-semibold text-brand">
                Forgot password?
              </Link>
            </div>
            <button type="submit" className="btn-primary w-full">
              Login
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default LoginPage;
