import Image from "next/image";

interface Props {
  /** Tailwind height (and width) utilities applied to the logo image. */
  className?: string;
  /**
   * Wrap the logo in a rounded white badge. Use on dark surfaces (landing /
   * auth pages) where the logo's off-white background would otherwise show as
   * a light box. Defaults to `false` for light app surfaces.
   */
  badge?: boolean;
  priority?: boolean;
}

/**
 * StudentBites brand lockup. The source artwork already contains the wordmark
 * and tagline, so call sites should not render additional brand text.
 */
export default function Logo({
  className = "h-8 w-auto",
  badge = false,
  priority = false,
}: Props) {
  const img = (
    <Image
      src="/logo.png"
      alt="StudentBites"
      width={572}
      height={303}
      priority={priority}
      className={className}
    />
  );

  if (!badge) return img;

  return (
    <span className="inline-flex items-center rounded-2xl bg-white px-3 py-2 shadow-lg shadow-black/20 ring-1 ring-black/5">
      {img}
    </span>
  );
}
