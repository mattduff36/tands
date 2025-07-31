/**
 * Dynamically loaded reporting dashboard for better code splitting
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Dynamic import with loading state
const ReportingDashboard = dynamic(
  () => import('./ReportingDashboard'),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    ),
    ssr: false, // Disable SSR for admin components
  }
);

export default ReportingDashboard;