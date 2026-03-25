import Image from 'next/image';
import Link from 'next/link';

type LogoVariant = 'full' | 'icon' | 'text-only';
type LogoSize = 'sm' | 'md' | 'lg';

const sizes = {
  sm: { icon: 28, height: 28, wordmarkWidth: 100 },
  md: { icon: 40, height: 40, wordmarkWidth: 140 },
  lg: { icon: 56, height: 56, wordmarkWidth: 196 },
};

export default function HaulCommandLogo({
  variant = 'full',
  size = 'md',
  href = '/',
  className = '',
}: {
  variant?: LogoVariant;
  size?: LogoSize;
  href?: string | null;
  className?: string;
}) {
  const { icon, height, wordmarkWidth } = sizes[size];

  const content = (
    <span className={`flex items-center justify-center ${className}`}>
      <Image
        src="/logo-transparent.png"
        alt="Haul Command"
        width={wordmarkWidth}
        height={height}
        priority
        className="object-contain"
      />
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
