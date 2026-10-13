interface OfferBannerProps {
  title: string;
  subtitle: string;
  couponCode?: string;
}

export function OfferBanner({ title, subtitle, couponCode }: OfferBannerProps) {
  return (
    <article className="card h-full bg-gradient-to-br from-brand to-brand-dark p-5 text-white sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75 sm:text-sm">Limited offer</p>
      <h3 className="mt-3 text-xl font-extrabold sm:text-2xl">{title}</h3>
      <p className="mt-2 text-sm text-white/80">{subtitle}</p>
      {couponCode ? <span className="mt-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">Code: {couponCode}</span> : null}
    </article>
  );
}
