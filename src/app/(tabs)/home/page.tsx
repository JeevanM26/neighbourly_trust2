'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import HomeScreen from '../../../components/screens/HomeScreen';

export default function HomePage() {
  const router = useRouter();

  const handleSelectCategory = (categoryId: string) => {
    router.push(`/map?category=${categoryId}`);
  };

  const handleSelectWorker = (workerId: string, categoryId?: string) => {
    if (categoryId) {
      router.push(`/map?category=${categoryId}&worker=${workerId}`);
    } else {
      router.push(`/map?worker=${workerId}`);
    }
  };

  return (
    <HomeScreen 
      onSelectCategory={handleSelectCategory} 
      onSelectWorker={handleSelectWorker} 
    />
  );
}
