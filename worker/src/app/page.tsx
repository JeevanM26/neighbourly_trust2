'use client';

import React from 'react';
import WorkerTabsLayout from './(tabs)/layout';
import DashboardPage from './(tabs)/dashboard/page';

export default function RootPage() {
  return (
    <WorkerTabsLayout>
      <DashboardPage />
    </WorkerTabsLayout>
  );
}
