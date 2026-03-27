import type { Metadata } from 'next';
import AutonomousDashboard from './AutonomousDashboard';

export const metadata: Metadata = {
  title: 'Autonomous Command Center — Haul Command Admin',
  description: 'Real-time monitoring dashboard for the 72-agent autonomous logistics swarm system.',
};

export default function AutonomousPage() {
  return <AutonomousDashboard />;
}
