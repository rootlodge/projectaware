'use client';

import React from 'react';
import MetacognitionDashboard from '@/components/MetacognitionDashboard';

export default function MetacognitionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <div className="container mx-auto px-4 py-8">
        <MetacognitionDashboard />
      </div>
    </div>
  );
}
