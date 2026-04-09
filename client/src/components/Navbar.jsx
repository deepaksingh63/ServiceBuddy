import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [providerUnreadMessages, setProviderUnreadMessages] = useState(0);
  const [userUnreadMessages, setUserUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalNotificationCount = providerUnreadMessages + userUnreadMessages;

  useEffect(() => {
    const syncUnread = () => {
      setProviderUnreadMessages(Number(window.localStorage.getItem("providerUnreadMessages") || 0));
      setUserUnreadMessages(Number(window.localStorage.getItem("userUnreadMessages") || 0));
    };

    syncUnread();
    window.addEventListener("provider-unread-updated", syncUnread);
    window.addEventListener("user-unread-updated", syncUnread);

    return () => {
      window.removeEventListener("provider-unread-updated", syncUnread);
      window.removeEventListener("user-unread-updated", syncUnread);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-sand/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-ink">
          <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.4rem] bg-ink shadow-soft">
            <span className="absolute inset-x-0 top-0 h-1/2 bg-brand/18" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-brand" />
            <span className="relative text-lg font-black tracking-[0.18em] text-white">SB</span>
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-xl font-semibold text-ink">ServiceBuddy</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand/80">
              Trusted Local Help
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-ink/80 md:flex">
          <NavLink to="/" className="hover:text-brand">
            Home
          </NavLink>
          <NavLink to="/services" className="hover:text-brand">
            Services
          </NavLink>
          {user?.role === "provider" && (
            <NavLink to="/provider" className="hover:text-brand">
              Provider Panel
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin" className="hover:text-brand">
              Admin Panel
            </NavLink>
          )}
          {user && (
            <NavLink to="/bookings" className="hover:text-brand">
              Bookings
            </NavLink>
          )}
          {user && (
            <NavLink to="/notifications" className="hover:text-brand">
              Notifications
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to={user.role === "user" ? "/account" : user.role === "provider" ? "/provider" : "/admin"}
                className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm text-ink/80 transition hover:border-brand hover:text-brand"
              >
                {user.name}
              </Link>
              {user.role === "provider" && (
                <Link to="/provider" className="relative text-brand transition hover:text-ink">
                  <BriefcaseBusiness className="h-5 w-5" />
                  {providerUnreadMessages > 0 && (
                    <span className="absolute -right-2 -top-2 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {providerUnreadMessages}
                    </span>
                  )}
                </Link>
              )}
              {user.role === "admin" && <ShieldCheck className="h-5 w-5 text-brand" />}
              <Link to="/notifications" className="relative text-brand transition hover:text-ink">
                <Bell className="h-5 w-5" />
                {totalNotificationCount > 0 && (
                  <span className="absolute -right-2 -top-2 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {totalNotificationCount}
                  </span>
                )}
              </Link>
              {user.role === "user" && (
                <Link to="/bookings" className="relative text-brand transition hover:text-ink">
                  <UserRound className="h-5 w-5" />
                  {userUnreadMessages > 0 && (
                    <span className="absolute -right-2 -top-2 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {userUnreadMessages}
                    </span>
                  )}
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-teal"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-ink/10 px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-soft hover:bg-[#bf6e49]"
              >
                Join Now
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="relative flex h-12 items-center gap-2 overflow-hidden rounded-full border border-brand/20 bg-white pl-2 pr-3 text-ink shadow-[0_14px_35px_rgba(228,126,78,0.16)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(228,126,78,0.22)] md:hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-brand/10 via-white to-teal/10" />
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white shadow-[0_10px_24px_rgba(15,29,40,0.22)]">
            {user ? <UserRound className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </span>
          <span className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
            {user ? "Profile" : "Menu"}
          </span>
          {user?.role === "provider" && providerUnreadMessages > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {providerUnreadMessages}
            </span>
          )}
          {user?.role === "user" && userUnreadMessages > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {userUnreadMessages}
            </span>
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" onClick={closeMenu}>
          <div className="absolute inset-0 bg-ink/68 backdrop-blur-sm" aria-hidden="true" />
          <div
            className="absolute right-0 top-0 flex h-full w-[80vw] max-w-sm flex-col border-l border-white/10 bg-[#10202c] p-5 text-white shadow-[0_30px_80px_rgba(15,29,40,0.56)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-lg font-semibold text-white">{user ? user.name : "Menu"}</p>
                <p className="text-xs uppercase tracking-[0.22em] text-brand/85">
                  {user ? user.role : "Guest access"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex flex-1 flex-col gap-3">
              <Link
                to="/"
                onClick={closeMenu}
                className="rounded-2xl border border-white/10 bg-[#172b39] px-4 py-3 text-sm font-semibold text-white transition hover:border-brand/30 hover:bg-[#1b3242]"
              >
                Home
              </Link>
              <Link
                to="/services"
                onClick={closeMenu}
                className="rounded-2xl border border-white/10 bg-[#172b39] px-4 py-3 text-sm font-semibold text-white transition hover:border-brand/30 hover:bg-[#1b3242]"
              >
                Services
              </Link>

              {user?.role === "user" && (
                <>
                  <Link
                    to="/notifications"
                    onClick={closeMenu}
                    className="rounded-2xl border border-white/10 bg-[#172b39] px-4 py-3 text-sm font-semibold text-white transition hover:border-brand/30 hover:bg-[#1b3242]"
                  >
                    Notifications
                  </Link>
                  <Link
                    to="/account"
                    onClick={closeMenu}
                    className="rounded-2xl border border-white/10 bg-[#172b39] px-4 py-3 text-sm font-semibold text-white transition hover:border-brand/30 hover:bg-[#1b3242]"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/bookings"
                    onClick={closeMenu}
                    className="rounded-2xl border border-white/10 bg-[#172b39] px-4 py-3 text-sm font-semibold text-white transition hover:border-brand/30 hover:bg-[#1b3242]"
                  >
                    Bookings
                  </Link>
                </>
              )}

              {user?.role === "provider" && (
                <>
                  <Link
                    to="/notifications"
                    onClick={closeMenu}
                    className="rounded-2xl border border-white/10 bg-[#172b39] px-4 py-3 text-sm font-semibold text-white transition hover:border-brand/30 hover:bg-[#1b3242]"
                  >
                    Notifications
                  </Link>
                  <Link
                    to="/provider"
                    onClick={closeMenu}
                    className="rounded-2xl border border-white/10 bg-[#172b39] px-4 py-3 text-sm font-semibold text-white transition hover:border-brand/30 hover:bg-[#1b3242]"
                  >
                    Provider Panel
                  </Link>
                  <Link
                    to="/bookings"
                    onClick={closeMenu}
                    className="rounded-2xl border border-white/10 bg-[#172b39] px-4 py-3 text-sm font-semibold text-white transition hover:border-brand/30 hover:bg-[#1b3242]"
                  >
                    Bookings
                  </Link>
                </>
              )}

              {user?.role === "admin" && (
                <>
                  <Link
                    to="/notifications"
                    onClick={closeMenu}
                    className="rounded-2xl border border-white/10 bg-[#172b39] px-4 py-3 text-sm font-semibold text-white transition hover:border-brand/30 hover:bg-[#1b3242]"
                  >
                    Notifications
                  </Link>
                  <Link
                    to="/admin"
                    onClick={closeMenu}
                    className="rounded-2xl border border-white/10 bg-[#172b39] px-4 py-3 text-sm font-semibold text-white transition hover:border-brand/30 hover:bg-[#1b3242]"
                  >
                    Admin Panel
                  </Link>
                </>
              )}

              {!user && (
                <>
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="rounded-2xl border border-white/10 bg-[#172b39] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1b3242]"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white"
                  >
                    Join Now
                  </Link>
                </>
              )}
            </div>

            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
