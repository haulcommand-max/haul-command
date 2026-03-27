import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Dispatch — AI-Powered Load Matching',
  description: 'Post loads and match with verified pilot car operators in real time. AI-powered dispatch for oversize and heavy haul escort coverage.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function DispatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
