"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Tabs
// Segmented control pattern for switching content views.
// Gold underline on active, elevated surface background.
// ══════════════════════════════════════════════════════════════

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center gap-1",
      "h-12 rounded-xl p-1",
      "bg-hc-elevated border border-hc-border-bare",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center",
      "whitespace-nowrap rounded-lg px-4 py-2",
      "text-sm font-semibold text-hc-subtle",
      "transition-all duration-200",
      "hover:text-hc-text",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hc-gold-500/40",
      // Active state
      "data-[state=active]:bg-hc-high",
      "data-[state=active]:text-hc-gold-400",
      "data-[state=active]:shadow-sm",
      "data-[state=active]:border data-[state=active]:border-hc-gold-500/20",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hc-gold-500/40",
      // Entrance animation
      "data-[state=active]:animate-slide-up",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
