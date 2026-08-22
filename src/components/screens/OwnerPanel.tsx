'use client';
import React from 'react';
import AdminDashboard from '../admin/AdminDashboard';

export default function OwnerPanel({ onClose }: { onClose: () => void }) {
  return <AdminDashboard onClose={onClose} />;
}
