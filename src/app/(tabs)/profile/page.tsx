'use client';

import React, { useState } from 'react';
import ProfileScreen from '../../../components/screens/ProfileScreen';
import OwnerPanel from '../../../components/screens/OwnerPanel';

export default function ProfilePage() {
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);

  if (showOwnerPanel) {
    return <OwnerPanel onClose={() => setShowOwnerPanel(false)} />;
  }

  return <ProfileScreen onOpenOwnerPanel={() => setShowOwnerPanel(true)} />;
}
