import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import SectionTitle from "../../components/SectionTitle";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { getDistrictOptions, indiaStates } from "../../data/indiaLocations";

const categoryThemes = {
  Electrician: "from-[#ffe8db] to-white",
  Plumber: "from-[#ddf1ff] to-white",
  Cleaner: "from-[#e2f6ea] to-white",
  Labour: "from-[#f5e6d9] to-white",
  Mason: "from-[#efe3d2] to-white",
  Cook: "from-[#fff2d8] to-white",
};

const ServicesPage = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [providerFilters, setProviderFilters] = useState({
    country: "India",
    state: "",
    district: "",
    city: "",
    area: "",
  });
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await api.get("/services");
      setServices(data);
    };

    fetchServices();
  }, []);

  const categoryCards = useMemo(() => {
    const grouped = services.reduce((accumulator, service) => {
      if (!service.category || service.category.toLowerCase() === "general") {
        return accumulator;
      }

      if (!accumulator[service.category]) {
        accumulator[service.category] = [];
      }
      accumulator[service.category].push(service);
      return accumulator;
    }, {});

    return Object.entries(grouped).map(([category, items]) => ({
      category,
      providersCount: new Set(items.map((item) => item.providerId?._id)).size,
    }));
  }, [services]);

  const filteredProfiles = useMemo(() => {
    const matchingServices = services.filter((service) => {
      if (!selectedCategory || service.category !== selectedCategory) {
        return false;
      }

      const profile = service.providerId?.providerProfile || {};
      const matchesArea = providerFilters.area
        ? (profile.area || service.area || "").toLowerCase().includes(providerFilters.area.toLowerCase())
        : true;
      const matchesDistrict = providerFilters.district
        ? (profile.district || "").toLowerCase().includes(providerFilters.district.toLowerCase())
        : true;
      const matchesCity = providerFilters.city
        ? (profile.city || service.city || "").toLowerCase().includes(providerFilters.city.toLowerCase())
        : true;
      const matchesState = providerFilters.state
        ? (profile.state || "").toLowerCase().includes(providerFilters.state.toLowerCase())
        : true;

      return matchesArea && matchesDistrict && matchesCity && matchesState;
    });

    const groupedByProvider = new Map();

    matchingServices.forEach((service) => {
      const providerId = service.providerId?._id;
      if (!providerId) {
        return;
      }

      const existing = groupedByProvider.get(providerId);
      if (!existing) {
        groupedByProvider.set(providerId, service);
        return;
      }

      const existingSkills = existing.providerId?.providerProfile?.skills?.length || 0;
      const currentSkills = service.providerId?.providerProfile?.skills?.length || 0;

      if (currentSkills > existingSkills) {
        groupedByProvider.set(providerId, service);
      }
    });

    const uniqueProviders = Array.from(groupedByProvider.values());

    return uniqueProviders.sort((first, second) => {
      if (sortBy === "price") {
        return Number(first.price || 0) - Number(second.price || 0);
      }

      if (sortBy === "newest") {
        return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
      }

      return Number(second.averageRating || 0) - Number(first.averageRating || 0);
    });
  }, [providerFilters, selectedCategory, services, sortBy]);

  const districtOptions = getDistrictOptions(providerFilters.state);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {!selectedCategory ? (
          <>
            <SectionTitle
              eyebrow="Browse categories"
              title="Choose the service you need"
              description="Start by choosing a category. Then you will see provider profile cards for that service."
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {categoryCards.map((card) => (
                <button
                  key={card.category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(card.category);
                    setProviderFilters({ country: "India", area: "", city: "", district: "", state: "" });
                  }}
                  className={`rounded-[2rem] bg-gradient-to-br ${categoryThemes[card.category] || "from-white to-sand"} p-8 text-left shadow-soft transition hover:-translate-y-1`}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand">
                    {card.category}
                  </p>
                  <h3 className="mt-6 text-3xl font-semibold text-ink">{card.category}</h3>
                  <p className="mt-4 text-sm text-ink/65">
                    {card.providersCount} provider{card.providersCount !== 1 ? "s" : ""} available
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setSelectedCategory("")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to categories
            </button>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand">
                  {selectedCategory}
                </p>
                <h1 className="mt-2 text-4xl font-semibold text-ink">Available provider profiles</h1>
              </div>
              <select
                className="input max-w-xs"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating">Sort by highest rating</option>
                <option value="price">Sort by lowest price</option>
                <option value="newest">Sort by newest provider</option>
              </select>
            </div>

            <div className="mt-8 grid gap-4 rounded-[1.75rem] bg-white p-5 shadow-soft md:grid-cols-5">
              <input className="input" value={providerFilters.country} readOnly />
              <input
                className="input"
                list="search-state-options"
                placeholder="Search by state"
                value={providerFilters.state}
                onChange={(e) =>
                  setProviderFilters((prev) => ({
                    ...prev,
                    state: e.target.value,
                    district: "",
                    city: "",
                    area: "",
                  }))
                }
              />
              <datalist id="search-state-options">
                {indiaStates.map((state) => (
                  <option key={state} value={state} />
                ))}
              </datalist>
              <input
                className="input"
                list="search-district-options"
                placeholder="Search by district"
                value={providerFilters.district}
                onChange={(e) =>
                  setProviderFilters((prev) => ({
                    ...prev,
                    district: e.target.value,
                    city: "",
                    area: "",
                  }))
                }
              />
              <datalist id="search-district-options">
                {districtOptions.map((district) => (
                  <option key={district} value={district} />
                ))}
              </datalist>
              <input
                className="input"
                placeholder="Search by city"
                value={providerFilters.city}
                onChange={(e) => setProviderFilters((prev) => ({ ...prev, city: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Search by area (optional)"
                value={providerFilters.area}
                onChange={(e) => setProviderFilters((prev) => ({ ...prev, area: e.target.value }))}
              />
            </div>

            <div className="mt-10 space-y-5">
              {filteredProfiles.length === 0 && (
                <div className="rounded-[1.75rem] bg-white p-6 text-sm text-ink/70 shadow-soft">
                  No provider found for this selected location. Try another state, district, city, or clear the optional area filter.
                </div>
              )}
              {filteredProfiles.map((service) => (
                <div key={service._id} className="rounded-[1.75rem] bg-white p-5 shadow-soft">
                  <div className="flex items-start gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-sand text-2xl font-semibold text-brand">
                      {service.providerId?.name?.slice(0, 1) || "P"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                        {selectedCategory}
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold text-ink">
                        {service.providerId?.name}
                      </h3>
                      <p className="mt-2 text-sm text-ink/65">Only service charge: Rs. {service.price}</p>
                      <p className="mt-1 text-sm text-ink/65">
                        Specialist work: {(service.providerId?.providerProfile?.skills || []).join(", ") || service.category}
                      </p>
                      <p className="mt-1 text-sm text-[#1f7a38]">
                        {service.providerId?.providerProfile?.availabilityLabel || "Available today"}
                        {service.providerId?.providerProfile?.nextAvailableSlot
                          ? ` | ${service.providerId.providerProfile.nextAvailableSlot}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to={`/services/${service._id}`}
                      className="rounded-full border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink"
                    >
                      View profile
                    </Link>
                    {user?.role === "user" ? (
                      <Link to={`/services/${service._id}/book`} className="btn-primary">
                        Book service
                      </Link>
                    ) : (
                      <Link to="/login" className="btn-primary">
                        Login to book
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!user && (
              <p className="mt-6 text-sm text-ink/65">
                Please <Link to="/login" className="font-semibold text-brand">log in</Link> to book a service.
              </p>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default ServicesPage;
