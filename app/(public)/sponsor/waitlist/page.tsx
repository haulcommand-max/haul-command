import { Suspense } from "react";
import WaitlistClient from "./WaitlistClient";

export default function SponsorWaitlistPage() {
  return (
    <div className=" bg-[#060b12] text-white">
      <Suspense fallback={<div className=" flex items-center justify-center">Loading Waitlist...</div>}>
        <WaitlistClient />
      </Suspense>
    </div>
  );
}