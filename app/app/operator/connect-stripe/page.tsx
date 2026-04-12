import { Suspense } from "react";
import ConnectStripeClient from "./ConnectStripeClient";

export default function ConnectStripePage() {
    return (
        <Suspense fallback={<div className=" bg-hc-bg text-white flex items-center justify-center p-8">Loading verification...</div>}>
            <ConnectStripeClient />
        </Suspense>
    );
}