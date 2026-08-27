'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MapScreen from '../../../components/screens/MapScreen';
import WorkerProfileSheet from '../../../components/screens/WorkerProfileSheet';

function MapScreenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryId = searchParams?.get('category') || null;
  const workerId = searchParams?.get('worker') || null;

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

  const handleSelectWorker = (wId: string, catId?: string) => {
    const finalCatId = catId || categoryId || '';
    if (finalCatId) {
      router.push(`/map?category=${finalCatId}&worker=${wId}`);
    } else {
      router.push(`/map?worker=${wId}`);
    }
  };

  const handleClearCategory = () => {
    router.push('/map');
  };

  const handleSelectCategory = (catId: string) => {
    router.push(`/map?category=${catId}`);
  };

  if (workerId) {
    return (
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <WorkerProfileSheet
          workerId={workerId}
          categoryId={categoryId || ''}
          onBack={handleBackToResults}
          onBooked={handleBooked}
        />
      </div>
    );
  }

  return (
    <MapScreen 
      categoryId={categoryId} 
      onSelectWorker={handleSelectWorker}
      onClearCategory={handleClearCategory}
      onSelectCategory={handleSelectCategory}
    />
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <MapScreenContent />
    </Suspense>
  );
}
