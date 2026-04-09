import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import toast from "react-hot-toast";
import AppLayout from "../../layouts/AppLayout";
import { api, getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const getAssetUrl = (fileUrl) => {
  if (!fileUrl) {
    return "";
  }

  if (fileUrl.startsWith("http")) {
    return fileUrl;
  }

  return `${api.defaults.baseURL.replace(/\/api$/, "")}${fileUrl}`;
};

const ServiceProfilePage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data } = await api.get(`/services/${serviceId}`);
        setService(data);
      } catch (error) {
        toast.error(getErrorMessage(error));
        navigate("/services");
      }
    };

    fetchService();
  }, [navigate, serviceId]);

  if (!service) {
    return (
      <AppLayout>
        <div className="p-10 text-center text-ink">Loading profile...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/services")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to services
        </button>

        <div className="mt-6 rounded-[2rem] bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {service.providerId?.avatar ? (
              <img
                src={getAssetUrl(service.providerId.avatar)}
                alt={service.providerId?.name}
                className="h-28 w-28 rounded-[2rem] object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-sand text-4xl font-semibold text-brand">
                {service.providerId?.name?.slice(0, 1) || "P"}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">{service.category}</p>
              <h1 className="mt-2 text-4xl font-semibold text-ink">{service.providerId?.name}</h1>
              <p className="mt-3 text-sm leading-7 text-ink/70">{service.description}</p>

              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-[#e8f5eb] px-4 py-2 text-[#1f7a38]">
                  {service.providerId?.providerProfile?.availabilityLabel || "Available today"}
                  {service.providerId?.providerProfile?.nextAvailableSlot
                    ? ` | ${service.providerId.providerProfile.nextAvailableSlot}`
                    : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-sand p-5">
              <p className="text-sm text-ink/60">Experience</p>
              <p className="mt-1 text-xl font-semibold text-ink">
                {service.providerId?.providerProfile?.experience || 0} years
              </p>
            </div>
            <div className="rounded-3xl bg-sand p-5">
              <p className="text-sm text-ink/60">Rating</p>
              <p className="mt-1 inline-flex items-center gap-2 text-xl font-semibold text-ink">
                <Star className="h-4 w-4 fill-brand text-brand" />
                {service.averageRating || "New"}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-ink/70">
            <p>
              <span className="font-semibold text-ink">Specialist work:</span>{" "}
              {(service.providerId?.providerProfile?.skills || []).join(", ") || service.category}
            </p>
            <p>
              <span className="font-semibold text-ink">Location:</span>{" "}
              {service.providerId?.providerProfile?.country || "India"}, {service.providerId?.providerProfile?.state}
              {service.providerId?.providerProfile?.district ? `, ${service.providerId.providerProfile.district}` : ""}
              , {service.providerId?.providerProfile?.city}
              {service.providerId?.providerProfile?.area ? `, ${service.providerId.providerProfile.area}` : ""}
            </p>
            <p>
              <span className="font-semibold text-ink">Support access:</span> Contact is shared by company support after booking confirmation.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
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
      </div>
    </AppLayout>
  );
};

export default ServiceProfilePage;
