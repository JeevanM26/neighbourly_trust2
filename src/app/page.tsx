'use client';

import React from 'react';
import CustomerTabsLayout from './(tabs)/layout';
import HomePage from './(tabs)/home/page';

export default function RootPage() {
  return (
    <CustomerTabsLayout>
      <HomePage />
    </CustomerTabsLayout>
  );
}
