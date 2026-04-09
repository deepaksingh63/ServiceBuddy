import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../../layouts/AppLayout";
import { api, getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { getDistrictOptions, indiaStates } from "../../data/indiaLocations";

const BookingRequestPage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [formData, setFormData] = useState({
    customerName: user?.name || "",
    customerPhone: user?.phone || "",
    date: "",
    time: "",
    state: "",
    district: "",
    city: "",
    area: "",
    pincode: "",
    addressLine: "",
    notes: "",
  });
  const [problemImage, setProblemImage] = useState(null);
  const [locationPreview, setLocationPreview] = useState("");
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [isCurrentLocationLoading, setIsCurrentLocationLoading] = useState(false);

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

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      customerName: user?.name || "",
      customerPhone: user?.phone || "",
    }));
  }, [user]);

  const updateField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "state" ? { district: "", city: "", area: "" } : {}),
      ...(name === "district" ? { city: "", area: "" } : {}),
    }));
  };

  const districtOptions = getDistrictOptions(formData.state);

  const lookupPincode = async (pincode) => {
    const cleanPincode = String(pincode || "").trim();

    if (!/^\d{6}$/.test(cleanPincode)) {
      setLocationPreview("");
      return;
    }

    try {
      setIsPincodeLoading(true);
      const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`);
      const data = await response.json();
      const office = data?.[0]?.PostOffice?.[0];

      if (!office) {
        setLocationPreview("No location found for this pincode.");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        state: office.State || prev.state,
        district: office.District || prev.district,
        city: office.Division || office.Block || office.Name || prev.city,
        area: office.Name || office.Block || prev.area,
        pincode: cleanPincode,
      }));

      setLocationPreview(
        `${office.Name || "Location found"}, ${office.District || ""}, ${office.State || ""} - ${cleanPincode}`
      );
    } catch (error) {
      setLocationPreview("Unable to verify pincode right now.");
    } finally {
      setIsPincodeLoading(false);
    }
  };

  const useCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Current location is not supported on this device");
      return;
    }

    try {
      setIsCurrentLocationLoading(true);

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      const address = data?.address || {};

      setFormData((prev) => ({
        ...prev,
        state: address.state || prev.state,
        district: address.state_district || address.county || prev.district,
        city: address.city || address.town || address.village || address.municipality || prev.city,
        area: address.suburb || address.neighbourhood || address.hamlet || prev.area,
        pincode: address.postcode || prev.pincode,
        addressLine: data?.display_name || prev.addressLine,
      }));

      setLocationPreview(data?.display_name || "Current location added");
      toast.success("Current location added");
    } catch (error) {
      toast.error("Unable to fetch current location");
    } finally {
      setIsCurrentLocationLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const fullAddress = [
      formData.addressLine,
      formData.area,
      formData.city,
      formData.district,
      formData.state,
      formData.pincode,
    ]
      .filter(Boolean)
      .join(", ");

    try {
      const payload = new FormData();
      payload.append("serviceId", serviceId);
      payload.append("customerName", formData.customerName);
      payload.append("customerPhone", formData.customerPhone);
      payload.append("date", formData.date);
      payload.append("time", formData.time);
      payload.append("address", fullAddress);
      payload.append("notes", formData.notes);
      if (problemImage) {
        payload.append("problemImage", problemImage);
      }

      await api.post("/bookings", payload);
      toast.success("Booking placed successfully");
      navigate("/bookings");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-white p-8 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Book service</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">
            {service?.providerId?.name || "Loading provider..."}
          </h1>
          <p className="mt-2 text-sm text-ink/65">
            {service?.title} | Only service charge: Rs. {service?.price ?? "--"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
            <input
              className="input md:col-span-2"
              placeholder="Your name"
              value={formData.customerName}
              onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
              required
            />
            <input
              className="input md:col-span-2"
              placeholder="Contact number"
              value={formData.customerPhone}
              onChange={(e) => setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))}
              required
            />
            <input
              type="date"
              className="input"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
            <input
              type="time"
              className="input"
              value={formData.time}
              onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
              required
            />
            <input className="input" value="India" readOnly />
            <input
              className="input"
              list="booking-state-options"
              placeholder="State"
              value={formData.state}
              onChange={(e) => updateField("state", e.target.value)}
              required
            />
            <datalist id="booking-state-options">
              {indiaStates.map((state) => (
                <option key={state} value={state} />
              ))}
            </datalist>
            <input
              className="input"
              list="booking-district-options"
              placeholder="District"
              value={formData.district}
              onChange={(e) => updateField("district", e.target.value)}
              required
            />
            <datalist id="booking-district-options">
              {districtOptions.map((district) => (
                <option key={district} value={district} />
              ))}
            </datalist>
            <input
              className="input"
              placeholder="City"
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="Area / locality (optional)"
              value={formData.area}
              onChange={(e) => updateField("area", e.target.value)}
            />
            <input
              className="input"
              placeholder="Pincode"
              value={formData.pincode}
              onChange={(e) => updateField("pincode", e.target.value)}
              onBlur={(e) => lookupPincode(e.target.value)}
              required
            />
            <div className="flex items-center text-sm text-ink/60">
              {isPincodeLoading
                ? "Checking pincode location..."
                : "Enter a valid pincode to auto-detect state, district, and city."}
            </div>
            <textarea
              className="input min-h-28 md:col-span-2"
              placeholder="Full house number, street, landmark"
              value={formData.addressLine}
              onChange={(e) => updateField("addressLine", e.target.value)}
              required
            />
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal"
                onClick={useCurrentLocation}
              >
                {isCurrentLocationLoading ? "Getting current location..." : "Use current location"}
              </button>
              {locationPreview && (
                <div className="rounded-2xl bg-sand px-4 py-3 text-sm text-ink/70">
                  {locationPreview}
                </div>
              )}
            </div>
            <textarea
              className="input min-h-24 md:col-span-2"
              placeholder="Describe the problem"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <div className="rounded-3xl border border-dashed border-brand/25 bg-sand p-4 md:col-span-2">
              <label className="block text-sm font-semibold text-ink">
                Add image of problem (optional)
              </label>
              <p className="mt-1 text-sm text-ink/60">
                You can upload a photo of the issue. This is optional.
              </p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,.pdf"
                className="input mt-4"
                onChange={(e) => setProblemImage(e.target.files?.[0] || null)}
              />
              {problemImage && (
                <p className="mt-2 text-sm text-ink/65">Selected file: {problemImage.name}</p>
              )}
            </div>
            <button type="submit" className="btn-primary w-full md:col-span-2">
              Confirm booking request
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default BookingRequestPage;
