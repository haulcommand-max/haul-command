// ══════════════════════════════════════════════════════════════
// BACKWARD COMPAT — Re-export canonical Button as PascalCase
// Legacy imports like `import { Button } from "@/components/ui/Button"`
// now point to the unified component.
// ══════════════════════════════════════════════════════════════
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";
