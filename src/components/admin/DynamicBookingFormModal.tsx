/**
 * Dynamically loaded booking form modal for better code splitting
 */

import dynamic from 'next/dynamic';

// Dynamic import with loading state
const BookingFormModal = dynamic(
  () => import('./BookingFormModal'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <div className="h-10 w-20 bg-gray-200 rounded"></div>
              <div className="h-10 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    ),
    ssr: false, // Disable SSR for modals
  }
);

export default BookingFormModal;