import { getFeatureFlags } from "@/lib/flags";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Log In — HAUL COMMAND",
    description:
        "Sign in to HAUL COMMAND to manage your escort listings, claim locations, and access the global heavy-haul intelligence network.",
};

export default function LoginPage() {
    const flags = getFeatureFlags();
    return <LoginClient flags={flags} />;
}
