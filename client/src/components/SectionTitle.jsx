const SectionTitle = ({ eyebrow, title, description }) => (
  <div className="max-w-2xl">
    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">{eyebrow}</p>
    <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">{title}</h2>
    {description && <p className="mt-4 text-base leading-7 text-ink/70">{description}</p>}
  </div>
);

export default SectionTitle;

