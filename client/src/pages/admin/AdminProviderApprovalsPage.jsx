import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppLayout from "../../layouts/AppLayout";
import { api } from "../../api/client";

const getAssetUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http")) return fileUrl;
  return `${api.defaults.baseURL.replace(/\/api$/, "")}${fileUrl}`;
};

const getRequestedPrice = (pricingNote) => {
  const matchedNumber = String(pricingNote || "").match(/\d+/);
  const requestedAmount = Number(matchedNumber?.[0] || 0);
  return requestedAmount > 0 ? requestedAmount : 399;
};

const AdminProviderApprovalsPage = () => {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const loadProviders = async () => {
    const { data } = await api.get("/admin/dashboard");
    setProviders(data.providers || []);
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const toggleApproval = async (providerId, isApproved) => {
    await api.patch(`/admin/providers/${providerId}/approval`, { isApproved: !isApproved });
    toast.success("Provider approval updated");
    await loadProviders();
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="hero-panel p-8 sm:p-10">
          <span className="section-tag">Admin section</span>
          <h1 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">Provider approvals</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
            Review provider profiles, inspect uploaded identity proof, and approve or revoke marketplace access from one dedicated page.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {providers.length > 0 ? (
            providers.map((provider) => (
              <div key={provider._id} className="surface-panel p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <p className="text-lg font-semibold text-ink">{provider.name}</p>
                    <p className="mt-1 text-sm text-ink/65">
                      {provider.providerProfile?.city}, {provider.providerProfile?.area}
                    </p>
                    <p className="mt-1 text-sm text-ink/65">
                      {provider.providerProfile?.address}{" "}
                      {provider.providerProfile?.pincode ? `- ${provider.providerProfile.pincode}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-ink/65">
                      Proof: {provider.providerProfile?.idProofType || "Not submitted"}
                    </p>
                  </button>
                  <button
                    type="button"
                    className={provider.providerProfile?.isApproved ? "btn-secondary" : "btn-primary"}
                    onClick={() => toggleApproval(provider._id, provider.providerProfile?.isApproved)}
                  >
                    {provider.providerProfile?.isApproved ? "Revoke approval" : "Approve provider"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="surface-panel p-10 text-center">
              <h2 className="text-2xl font-semibold text-ink">No provider profiles available</h2>
              <p className="mt-3 text-sm leading-7 text-ink/65">
                New provider registrations will appear here for approval review.
              </p>
            </div>
          )}
        </div>

        {selectedProvider && (
          <div className="fixed inset-0 z-50 bg-ink/40 px-4 py-10">
            <div className="mx-auto max-h-[90vh] max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-8 shadow-[0_28px_70px_rgba(17,33,45,0.24)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Provider profile</p>
                  <div className="mt-4 flex items-center gap-4">
                    {selectedProvider.avatar ? (
                      <img
                        src={getAssetUrl(selectedProvider.avatar)}
                        alt={selectedProvider.name}
                        className="h-20 w-20 rounded-[1.5rem] object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-sand text-3xl font-semibold text-brand">
                        {selectedProvider.name?.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-3xl font-semibold text-ink">{selectedProvider.name}</h2>
                      <p className="mt-2 text-sm text-ink/65">{selectedProvider.email}</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                  onClick={() => setSelectedProvider(null)}
                >
                  Close
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="surface-muted p-5">
                  <p className="text-sm text-ink/60">Phone</p>
                  <p className="mt-1 text-lg font-semibold text-ink">{selectedProvider.phone || "Not added"}</p>
                </div>
                <div className="surface-muted p-5">
                  <p className="text-sm text-ink/60">Approval status</p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {selectedProvider.providerProfile?.isApproved ? "Approved" : "Pending"}
                  </p>
                </div>
              </div>

              <div className="surface-muted mt-6 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Work profile</p>
                <p className="mt-3 text-sm leading-7 text-ink/75">
                  {selectedProvider.providerProfile?.bio || "No bio added"}
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-ink/60">Experience</p>
                    <p className="mt-1 font-semibold text-ink">{selectedProvider.providerProfile?.experience || 0} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink/60">Provider requested charge</p>
                    <p className="mt-1 font-semibold text-ink">
                      Rs. {getRequestedPrice(selectedProvider.providerProfile?.pricingNote)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-ink/60">Category</p>
                    <p className="mt-1 font-semibold text-ink">
                      {selectedProvider.providerProfile?.serviceCategory || "Not selected"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-ink/60">WhatsApp</p>
                    <p className="mt-1 font-semibold text-ink">
                      {selectedProvider.providerProfile?.whatsappNumber || "Not added"}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-ink/60">Customer visible price</p>
                  <p className="mt-1 font-semibold text-ink">
                    Rs. {getRequestedPrice(selectedProvider.providerProfile?.pricingNote) + 100}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="surface-muted p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Address</p>
                  <p className="mt-3 text-sm text-ink/75">{selectedProvider.providerProfile?.address || "No address added"}</p>
                  <p className="mt-2 text-sm text-ink/75">
                    {selectedProvider.providerProfile?.area}, {selectedProvider.providerProfile?.city},{" "}
                    {selectedProvider.providerProfile?.state} - {selectedProvider.providerProfile?.pincode}
                  </p>
                </div>
                <div className="surface-muted p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">ID proof</p>
                  <p className="mt-3 text-sm text-ink/75">
                    Type: {selectedProvider.providerProfile?.idProofType || "Not submitted"}
                  </p>
                  <p className="mt-2 text-sm text-ink/75">
                    Number: {selectedProvider.providerProfile?.idProofNumber || "Not submitted"}
                  </p>
                </div>
              </div>

              {selectedProvider.providerProfile?.idProofDocument?.fileUrl && (
                <div className="surface-muted mt-6 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Uploaded document</p>
                  {selectedProvider.providerProfile.idProofDocument.mimeType?.startsWith("image/") ? (
                    <img
                      src={getAssetUrl(selectedProvider.providerProfile.idProofDocument.fileUrl)}
                      alt="Provider document"
                      className="mt-4 max-h-96 w-full rounded-3xl object-contain bg-white"
                    />
                  ) : (
                    <a
                      href={getAssetUrl(selectedProvider.providerProfile.idProofDocument.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex rounded-full bg-white px-4 py-3 text-sm font-semibold text-brand"
                    >
                      Open uploaded document
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminProviderApprovalsPage;
