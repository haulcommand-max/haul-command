// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Design System Barrel Export
// Import from "@/components/ui" for any canonical component.
// ══════════════════════════════════════════════════════════════

// ── Primitives ──
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";
export { Badge, badgeVariants } from "./badge";
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";
export { Input } from "./input";
export { Textarea } from "./textarea";
export { Label } from "./label";
export { Checkbox } from "./checkbox";
export { Switch } from "./switch";
export { Separator } from "./separator";
export { Skeleton, SkeletonCard, SkeletonRow } from "./skeleton";
export { StatBlock } from "./stat-block";
export { EmptyState } from "./empty-state";

// ── Overlays ──
export {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogFooter, DialogTitle, DialogDescription, DialogClose,
} from "./dialog";
export {
  Sheet, SheetTrigger, SheetContent, SheetHeader,
  SheetFooter, SheetTitle, SheetDescription, SheetClose,
} from "./sheet";
export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuGroup,
} from "./dropdown-menu";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";
export { Popover, PopoverTrigger, PopoverContent } from "./popover";

// ── Navigation ──
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion";

// ── Forms ──
export {
  Select, SelectTrigger, SelectContent, SelectItem,
  SelectValue, SelectGroup, SelectLabel, SelectSeparator,
} from "./select";

// ── Identity ──
export { Avatar, AvatarImage, AvatarFallback } from "./avatar";

// ── Composites ──
export { FilterBar } from "./filter-bar";
export { BreadcrumbRail } from "./breadcrumb-rail";
export { TrustBadge, AvailableNowBadge } from "./trust-badge";
