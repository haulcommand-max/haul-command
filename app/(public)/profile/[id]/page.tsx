import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { OperatorProfilePage } from '@/components/operator/OperatorProfilePage';

/* ═══════════════════════════════════════════════════════════════════
   /place/[id] — Public operator profile page (already exists)
   This supplements the existing /place/[id] with social features
   If /profile/[id] doesn't exist, we create it here
   ═══════════════════════════════════════════════════════════════════ */

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Operator Profile | Haul Command`,
    description: `View operator profile, endorsements, and availability on Haul Command.`,
  };
}

export default async function OperatorPublicProfilePage({ params }: Props) {
  const { id } = await params;
  if (!id) notFound();

  return <OperatorProfilePage operatorId={id} />;
}
