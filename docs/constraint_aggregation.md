# Constraint Aggregation: The Multi-Constraint Booking Engine

This document defines the system for bundling all operational pain points into a single "One-Tap" checkout.

## 1. The Bundle Logic

When a move requires more than just a permit, the engine aggregates these layers:

1.  **Transport Rail**: The Carrier/Driver.
2.  **Permit Rail**: Anti-Gravity Agent filing.
3.  **Escort Rail**: 1-4 pilot cars (Lead/Chase/Steer).
4.  **Police Rail**: Automated jurisdiction coordination for LE escorts.
5.  **Utility Rail**: Bucket trucks for line lifts (height-sensitive).
6.  **Route Surveyor**: Physical verification of the path.

## 2. Technical Handshake (The Nuclear Weapon)

- **Unified Escrow**: The broker pays once; Haul Pay distributes to all 6 vendors simultaneously.
- **Dynamic Scheduling**: If the truck is delayed 2 hours, the system auto-pings the escorts, police, and bucket trucks to adjust.

## 3. Platform Gravity
By normalizing these constraints, we solve the "Member Suffering" of coordinating 15 variables. Carriers never have to make 20 phone calls again.

---
**Status**: PLANNING
**Goal**: Become the "Clear Pipe" for heavy transport.
