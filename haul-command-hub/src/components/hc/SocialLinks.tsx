const SOCIALS = [
  { label: 'X / Twitter', href: 'https://x.com/haulcommand', icon: '𝕏' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/haulcommand', icon: 'in' },
  { label: 'Instagram', href: 'https://instagram.com/haulcommand', icon: '📷' },
  { label: 'Facebook', href: 'https://facebook.com/haulcommand', icon: 'f' },
];

export default function SocialLinks() {
  return (
    <div className="flex gap-3 mt-4">
      {SOCIALS.map(s => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-amber-500/20 border border-white/10 flex items-center justify-center text-xs text-white/60 hover:text-white transition-all"
        >
          {s.icon}
        </a>
      ))}
    </div>
  );
}
