import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                slate: {
                    950: '#020617', // Main Dark
                },
                amber: {
                    500: '#f59e0b', // Safety Orange/Amber
                },
            },
        },
    },
    plugins: [],
};
export default config;
