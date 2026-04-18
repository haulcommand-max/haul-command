import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className=" bg-hc-bg flex items-center justify-center text-hc-text">
                <div className="animate-pulse text-gray-500">Loading...</div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}