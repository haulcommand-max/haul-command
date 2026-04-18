'use client';
import React from 'react';
// HCMobileNavTrigger is intentionally a no-op stub.
// The real mobile menu trigger is built into HCMobileMenu.
// Do not use this component — the GlobalCommandBar and HCGlobalHeader
// both use <HCMobileMenu /> directly which carries its own trigger button.
// This file is kept to avoid breaking imports in other layouts.
export function HCMobileNavTrigger() {
  return null;
}
