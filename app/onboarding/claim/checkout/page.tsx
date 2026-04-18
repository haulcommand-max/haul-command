import { Suspense } from "react";
import CheckoutContent from "./CheckoutContent";

export default function CheckoutRouter() {
    return (
        <Suspense fallback={
            <div className=" bg-hc-bg flex items-center justify-center text-hc-text font-sans">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#C6923A]/30">
                        <span className="animate-spin w-5 h-5 border-2 border-t-[#C6923A] border-r-transparent border-b-transparent border-l-transparent rounded-full" />
                    </div>
                    <h1 className="text-xl font-black">Securing Payment Gateway</h1>
                    <p className="text-gray-400 text-sm">Loading...</p>
                </div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}