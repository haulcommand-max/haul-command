// ══════════════════════════════════════════════════════════════
// BACKWARD COMPAT — Re-export canonical Button as HCButton
// Legacy imports like `import { HCButton } from "@/components/ui/hc-button"`
// now point to the unified component.
// ══════════════════════════════════════════════════════════════
export { Button as HCButton, Button as default } from "./Button";
export type { ButtonProps } from "./Button";
