import { Suspense } from "react";
import ClaimClient from "./ClaimClient";

export default function ClaimPage() {
    return (
        <Suspense fallback={<div className=" bg-hc-bg flex items-center justify-center text-white/50">Loading...</div>}>
            <ClaimClient />
        </Suspense>
    );
}