'use client';

import React, { useState, useEffect } from 'react';
import DashboardShell from '@/components/DashboardShell';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-screen bg-gray-50">{children}</div>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
