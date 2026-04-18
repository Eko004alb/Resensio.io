import { Link } from 'react-router-dom';

type BrandMarkProps = {
  /** If set, wraps in a React Router link */
  to?: string;
  className?: string;
  textClassName?: string;
  /** Logo height in Tailwind units (h-8 = 2rem) */
  logoClassName?: string;
};

export default function BrandMark({
  to,
  className = '',
  textClassName = 'text-indigo-200 group-hover:text-white transition-colors',
  logoClassName = 'h-9 w-9 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity',
}: BrandMarkProps) {
  const content = (
    <>
      <img
        src="/logo-combo1.svg"
        alt=""
        className={logoClassName}
        width={36}
        height={36}
        decoding="async"
      />
      <span className={`font-semibold text-lg tracking-tight ${textClassName}`}>Resensio</span>
    </>
  );

  const combined = `inline-flex items-center gap-2 ${className}`;

  if (to !== undefined) {
    return (
      <Link to={to} className={`group ${combined}`}>
        {content}
      </Link>
    );
  }

  return <div className={combined}>{content}</div>;
}
