import { Link } from "react-router-dom";
import { BadgeIndianRupee, CalendarClock, ShieldCheck, Star } from "lucide-react";
import SectionTitle from "../components/SectionTitle";
import { useAuth } from "../context/AuthContext";

const highlights = [
  {
    icon: ShieldCheck,
    title: "Trusted providers",
    text: "Admin-approved experts for local services.",
    stat: "Verified onboarding",
  },
  {
    icon: CalendarClock,
    title: "Easy booking",
    text: "Pick a date and time slot in seconds.",
    stat: "Fast scheduling",
  },
  {
    icon: Star,
    title: "Ratings & reviews",
    text: "Choose professionals with real user feedback.",
    stat: "Proof before booking",
  },
  {
    icon: BadgeIndianRupee,
    title: "Provider earnings",
    text: "Workers manage pricing and track income.",
    stat: "Business-ready tools",
  },
];

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(217,125,84,0.28),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(36,72,85,0.2),_transparent_30%)]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-full border border-brand/20 bg-white/70 px-4 py-2 shadow-soft backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_18px_rgba(217,125,84,0.8)]" />
              <p className="text-sm font-semibold tracking-[0.14em] text-brand">
                AI-powered local service booking
              </p>
            </div>

            <div className="mt-8 max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-ink/45">
                Smart discovery for everyday needs
              </p>
              <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-ink sm:text-6xl xl:text-[5.4rem]">
                Book trusted home service experts with a cleaner, faster workflow.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/68">
                ServiceBuddy helps users discover verified professionals, schedule appointments, track booking updates, and manage service conversations in one modern experience.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Verified providers", "Live booking flow", "Ratings and chat"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-ink/10 bg-white/75 px-4 py-2 text-sm font-medium text-ink/75 backdrop-blur"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/services"
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal"
              >
                Explore Services
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="rounded-full border border-ink/10 bg-white px-6 py-3 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
                >
                  Become a Provider
                </Link>
              )}
            </div>
          </div>

          <div className="relative rounded-[2rem] border border-white/50 bg-white/80 p-6 shadow-soft backdrop-blur">
            <div className="absolute inset-x-10 top-0 h-24 rounded-b-[2rem] bg-[radial-gradient(circle,_rgba(217,125,84,0.22),_transparent_70%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0f1d28] p-6 text-sand">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(217,125,84,0.22),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_50%)]" />
              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-brand/90">Booking intelligence</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">How the platform moves</h2>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                    Real workflow
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  {[
                    "User books a service",
                    "Provider reviews the request",
                    "Status updates and timing sync",
                    "Service completed and reviewed",
                  ].map((step, index) => (
                    <div
                      key={step}
                      className="flex items-center gap-4 rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white shadow-[0_12px_30px_rgba(217,125,84,0.28)]">
                        0{index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/92">{step}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/45">
                          Stage {index + 1}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    ["24/7", "Requests"],
                    ["Live", "Status sync"],
                    ["Safe", "Verified onboarding"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-lg font-semibold text-white">{value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-white/45">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Core features"
          title="Built around the exact workflow you described"
          description="Separate experiences for users, providers, and admin with room for advanced add-ons like reviews, chat, real-time status, location filtering, and payment integration."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map(({ icon: Icon, title, text, stat }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#0f1d28] p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand/30"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(217,125,84,0.18),_transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_55%)]" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-white/10 bg-white/5 text-brand">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand/90">
                    {stat}
                  </span>
                </div>
                <h3 className="mt-10 text-[1.45rem] font-semibold tracking-[-0.02em] text-white">{title}</h3>
                <p className="mt-3 max-w-[22rem] text-sm leading-7 text-white/72">{text}</p>
                <div className="mt-8 h-px w-full bg-gradient-to-r from-white/15 via-brand/30 to-transparent" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
                  ServiceBuddy feature
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
