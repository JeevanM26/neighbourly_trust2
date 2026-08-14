'use client';

import React from 'react';
import TabsLayout from './(tabs)/layout';
import HomePage from './(tabs)/home/page';

export default function RootPage() {
  return (
    <TabsLayout>
      <HomePage />
    </TabsLayout>
  );
}
