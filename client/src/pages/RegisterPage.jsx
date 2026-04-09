import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import { getDistrictOptions, indiaStates } from "../data/indiaLocations";
import { useAuth } from "../context/AuthContext";

const providerCategorySummaries = {
  Electrician: "All types of electrical services",
  Cleaner: "All types of home and office cleaning services",
  Plumber: "All types of plumbing and fitting services",
  Mason: "All types of masonry and repair services",
  Cook: "All types of home cooking services",
  Labour: "General labour and helper services",
};

const initialState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "user",
  providerProfile: {
    bio: "",
    experience: "",
    pricingNote: "",
    country: "India",
    state: "",
    district: "",
    city: "",
    area: "",
    address: "",
    pincode: "",
    whatsappNumber: "",
    idProofType: "",
    idProofNumber: "",
    serviceCategory: "",
    skills: [],
    coordinates: {
      lat: 0,
      lng: 0,
    },
  },
};

const RegisterPage = () => {
  const [formData, setFormData] = useState(initialState);
  const [idProofDocument, setIdProofDocument] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [locationPreview, setLocationPreview] = useState("");
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [isCurrentLocationLoading, setIsCurrentLocationLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProviderChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      providerProfile: {
        ...prev.providerProfile,
        [name]: value,
        ...(name === "state" ? { district: "", city: "", area: "" } : {}),
        ...(name === "district" ? { city: "", area: "" } : {}),
        ...(name === "serviceCategory" ? { skills: [] } : {}),
      },
    }));
  };

  const districtOptions = getDistrictOptions(formData.providerProfile.state);

  const applyLocationDetails = ({ state = "", district = "", city = "", area = "", address = "", pincode = "", coordinates }) => {
    setFormData((prev) => ({
      ...prev,
      providerProfile: {
        ...prev.providerProfile,
        ...(state ? { state } : {}),
        ...(district ? { district } : {}),
        ...(city ? { city } : {}),
        ...(area ? { area } : {}),
        ...(address ? { address } : {}),
        ...(pincode ? { pincode } : {}),
        ...(coordinates ? { coordinates } : {}),
      },
    }));
  };

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

      applyLocationDetails({
        state: office.State || "",
        district: office.District || "",
        city: office.Division || office.Block || office.Name || "",
        area: office.Name || office.Block || "",
        pincode: cleanPincode,
      });

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

      applyLocationDetails({
        state: address.state || "",
        district: address.state_district || address.county || "",
        city: address.city || address.town || address.village || address.municipality || "",
        area: address.suburb || address.neighbourhood || address.hamlet || "",
        address: data?.display_name || "",
        pincode: address.postcode || "",
        coordinates: {
          lat: latitude,
          lng: longitude,
        },
      });

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

    if (formData.role === "provider" && !idProofDocument) {
      toast.error("Please upload one legal ID proof document");
      return;
    }

    if (formData.role === "provider" && !formData.providerProfile.serviceCategory) {
      toast.error("Please select a provider category");
      return;
    }

    let payload;
    if (formData.role === "provider") {
      payload = new FormData();
      payload.append("name", formData.name);
      payload.append("email", formData.email);
      payload.append("password", formData.password);
      payload.append("phone", formData.phone);
      payload.append("role", formData.role);
      payload.append(
        "providerProfile",
        JSON.stringify({
          ...formData.providerProfile,
          skills: [],
          experience: Number(formData.providerProfile.experience || 0),
        })
      );
      payload.append("idProofDocument", idProofDocument);
      if (avatarFile) {
        payload.append("avatar", avatarFile);
      }
    } else {
      payload = {
        ...formData,
        providerProfile: undefined,
      };
    }

    const user = await register(payload);
    navigate(user.role === "provider" ? "/provider" : "/services");
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-8 shadow-soft">
          <h1 className="text-3xl font-semibold text-ink">Create account</h1>
          <p className="mt-2 text-sm text-ink/65">
            Create a user or provider account. Provider registration requires address details and a legal ID proof.
          </p>
          <p className="mt-3 text-sm text-ink/70">
            Already joined?{" "}
            <Link to="/login" className="font-semibold text-brand">
              Login here
            </Link>
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <input name="name" placeholder="Full name" className="input" value={formData.name} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email address" className="input" value={formData.email} onChange={handleChange} required />
            <input name="phone" placeholder="Mobile number" className="input" value={formData.phone} onChange={handleChange} required />
            <input name="password" type="password" placeholder="Create password" className="input" value={formData.password} onChange={handleChange} required />
            <select name="role" className="input md:col-span-2" value={formData.role} onChange={handleChange}>
              <option value="user">User</option>
              <option value="provider">Provider</option>
            </select>
          </div>

          {formData.role === "provider" && (
            <div className="mt-8 grid gap-5 rounded-3xl border border-dashed border-brand/30 bg-sand p-5 md:grid-cols-2">
              <p className="md:col-span-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                Provider details
              </p>
              <textarea
                name="bio"
                placeholder="Describe your work. Example: Professional electrician for wiring, switch repair, fan installation and home maintenance."
                className="input min-h-28 md:col-span-2"
                value={formData.providerProfile.bio}
                onChange={handleProviderChange}
                required
              />
              <select
                name="serviceCategory"
                className="input md:col-span-2"
                value={formData.providerProfile.serviceCategory}
                onChange={handleProviderChange}
                required
              >
                <option value="">Select provider category</option>
                {Object.keys(providerCategorySummaries).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {formData.providerProfile.serviceCategory && (
                <div className="md:col-span-2 rounded-2xl border border-brand/20 bg-white p-4">
                  <label className="block text-sm font-semibold text-ink">Service summary</label>
                  <p className="mt-1 text-sm text-ink/60">
                    Your provider profile will be shown under the selected category with this service summary.
                  </p>
                  <div className="mt-4 rounded-2xl bg-sand px-4 py-4 text-sm font-semibold text-ink">
                    {providerCategorySummaries[formData.providerProfile.serviceCategory]}
                  </div>
                </div>
              )}
              <input
                name="experience"
                type="number"
                min="0"
                placeholder="Experience in years"
                className="input"
                value={formData.providerProfile.experience}
                onChange={handleProviderChange}
                required
              />
              <input
                name="pricingNote"
                placeholder="Requested service charge. Example: 299"
                className="input"
                value={formData.providerProfile.pricingNote}
                onChange={handleProviderChange}
                required
              />
              <input
                name="country"
                placeholder="Country"
                className="input"
                value={formData.providerProfile.country}
                onChange={handleProviderChange}
                readOnly
              />
              <input
                name="state"
                list="india-state-options"
                placeholder="State"
                className="input"
                value={formData.providerProfile.state}
                onChange={handleProviderChange}
                required
              />
              <datalist id="india-state-options">
                {indiaStates.map((state) => (
                  <option key={state} value={state} />
                ))}
              </datalist>
              <input
                name="district"
                list="india-district-options"
                placeholder="District"
                className="input"
                value={formData.providerProfile.district}
                onChange={handleProviderChange}
                required
              />
              <datalist id="india-district-options">
                {districtOptions.map((district) => (
                  <option key={district} value={district} />
                ))}
              </datalist>
              <input
                name="city"
                placeholder="City"
                className="input"
                value={formData.providerProfile.city}
                onChange={handleProviderChange}
                required
              />
              <input
                name="area"
                placeholder="Area / locality (optional)"
                className="input"
                value={formData.providerProfile.area}
                onChange={handleProviderChange}
              />
              <input
                name="address"
                placeholder="Full address with house number, street, area, landmark"
                className="input md:col-span-2"
                value={formData.providerProfile.address}
                onChange={handleProviderChange}
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
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-ink/70">
                    {locationPreview}
                  </div>
                )}
              </div>
              <input
                name="pincode"
                placeholder="Pincode"
                className="input"
                value={formData.providerProfile.pincode}
                onChange={handleProviderChange}
                onBlur={(e) => lookupPincode(e.target.value)}
                required
              />
              <div className="flex items-center">
                <p className="text-sm text-ink/60">
                  {isPincodeLoading
                    ? "Checking pincode location..."
                    : "Enter a valid pincode to auto-detect state, district, and city."}
                </p>
              </div>
              <input
                name="whatsappNumber"
                placeholder="WhatsApp number"
                className="input"
                value={formData.providerProfile.whatsappNumber}
                onChange={handleProviderChange}
                required
              />
              <select
                name="idProofType"
                className="input"
                value={formData.providerProfile.idProofType}
                onChange={handleProviderChange}
                required
              >
                <option value="">Select legal ID proof</option>
                <option value="aadhaar-card">Aadhaar Card</option>
                <option value="pan-card">PAN Card</option>
                <option value="voter-id">Voter ID</option>
                <option value="driving-licence">Driving Licence</option>
              </select>
              <input
                name="idProofNumber"
                placeholder="ID proof number"
                className="input md:col-span-2"
                value={formData.providerProfile.idProofNumber}
                onChange={handleProviderChange}
                required
              />
              <div className="md:col-span-2 rounded-2xl border border-brand/20 bg-white p-4">
                <label className="mb-2 block text-sm font-semibold text-ink">
                  Upload profile photo (optional)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="input"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
                {avatarFile && (
                  <p className="mt-2 text-sm text-ink/65">Selected photo: {avatarFile.name}</p>
                )}
              </div>
              <div className="md:col-span-2 rounded-2xl border border-brand/20 bg-white p-4">
                <label className="mb-2 block text-sm font-semibold text-ink">
                  Upload legal document: Aadhaar Card, PAN Card, Voter ID, or Driving Licence
                </label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="input"
                  onChange={(e) => setIdProofDocument(e.target.files?.[0] || null)}
                  required
                />
                {idProofDocument && (
                  <p className="mt-2 text-sm text-ink/65">Selected file: {idProofDocument.name}</p>
                )}
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary mt-8 w-full">
            Register
          </button>
        </form>
      </div>
    </AppLayout>
  );
};

export default RegisterPage;
