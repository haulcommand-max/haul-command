"use client";

import * as React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Badge } from "./badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Filter Bar
// Sticky search + filter controls for directory/list pages.
// Mobile: search inline, filters in a bottom sheet.
// Desktop: search + chip rail + dropdown filters inline.
// ══════════════════════════════════════════════════════════════

interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Current search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Active filter count for mobile badge */
  activeFilterCount?: number;
  /** Content shown in the filter sheet (mobile) or inline (desktop) */
  filterContent?: React.ReactNode;
  /** Quick filter chips */
  chips?: React.ReactNode;
  /** Sticky positioning */
  sticky?: boolean;
}

export function FilterBar({
  searchPlaceholder = "Search directory...",
  searchValue = "",
  onSearchChange,
  activeFilterCount = 0,
  filterContent,
  chips,
  sticky = true,
  className,
  ...props
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "w-full",
        "bg-hc-bg/80 backdrop-blur-xl",
        "border-b border-hc-border-bare",
        "py-3 px-4 md:px-6",
        sticky && "sticky top-0 z-40",
        className
      )}
      {...props}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Top row: search + filter button */}
        <div className="flex items-center gap-3">
          {/* Search field */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-hc-subtle" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className={cn(
                "w-full h-11 rounded-xl pl-10 pr-4",
                "bg-hc-elevated text-hc-text text-base",
                "border border-hc-border",
                "placeholder:text-hc-subtle",
                "focus:outline-none focus:ring-2 focus:ring-hc-gold-500/40 focus:border-hc-gold-500/60",
                "transition-all duration-200"
              )}
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange?.("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-hc-high text-hc-subtle hover:text-hc-text transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Mobile: filter sheet trigger */}
          {filterContent && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-hc-gold-500 text-hc-bg text-[10px] font-black flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {filterContent}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Desktop: inline filter content */}
          {filterContent && (
            <div className="hidden md:flex items-center gap-3">
              {filterContent}
            </div>
          )}
        </div>

        {/* Chip rail */}
        {chips && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {chips}
          </div>
        )}

        {/* Active filter summary */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="gold" dot>{activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active</Badge>
          </div>
        )}
      </div>
    </div>
  );
}
