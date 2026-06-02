import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Offer Inbox - Haul Command Dispatch",
  description: "View and respond to canonical Haul Command match offers.",
};

export default function OffersPage() {
  redirect("/offers/inbox");
}
