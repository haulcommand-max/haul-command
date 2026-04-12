import { redirect } from 'next/navigation';
// /roles/broker â€” the broker experience lives at /broker (existing page)
export default function BrokerRolePage() {
  redirect('/broker');
}