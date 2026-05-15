import type { CSSProperties, ReactNode } from "react";

type DirectoryBackgroundShellProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "main" | "div";
};

const BASE_CLASS =
  "hc-page-shell hc-surface-site-dark hc-directory-background-shell min-h-screen bg-transparent text-[#fff7e8] selection:bg-[#F1A91B]/30";

export function DirectoryBackgroundShell({
  children,
  className = "",
  style,
  as = "main",
}: DirectoryBackgroundShellProps) {
  const shellClassName = `${BASE_CLASS} ${className}`.trim();

  if (as === "div") {
    return (
      <div className={shellClassName} style={style}>
        {children}
      </div>
    );
  }

  return (
    <main className={shellClassName} style={style}>
      {children}
    </main>
  );
}
