'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MapScreen from '../../../components/screens/MapScreen';
import WorkerProfileSheet from '../../../components/screens/WorkerProfileSheet';

function MapScreenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryId = searchParams?.get('category') || undefined;
  const workerId = searchParams?.get('worker') || undefined;

  const handleBackToResults = () => {
    if (categoryId) {
      router.push(`/map?category=${categoryId}`);
    } else {
      router.push('/map');
    }
  };

  const handleBooked = () => {
    router.push('/bookings');
  };

  if (workerId && categoryId) {
    return (
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <WorkerProfileSheet
          workerId={workerId}
          categoryId={categoryId}
          onBack={handleBackToResults}
          onBooked={handleBooked}
        />
      </div>
    );
  }

  return <MapScreen selectedCategoryId={categoryId} selectedWorkerId={workerId} />;
}

export default function MapPage() {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <MapScreenContent />
    </Suspense>
  );
}
