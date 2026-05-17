import { redirect } from 'next/navigation';

export const revalidate = 10;

export default function AvailableNowFixedPage() {
  redirect('/available-now');
}
