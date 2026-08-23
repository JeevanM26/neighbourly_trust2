'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardScreen from '../../../components/screens/DashboardScreen';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <DashboardScreen 
      onGoToRequests={() => router.push('/requests')} 
      onGoToJobs={() => router.push('/jobs')} 
    />
  );
}
