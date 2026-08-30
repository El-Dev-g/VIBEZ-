import { fetchUserById } from '../../../services/api';
import { notFound } from 'next/navigation';
import UserDetailClient from './UserDetailClient';

export const dynamic = 'force-dynamic';

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const user = await fetchUserById(id);

  if (!user) {
    notFound();
  }

  return <UserDetailClient initialUser={user} />;
}

