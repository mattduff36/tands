import { Suspense } from 'react';
import { BookingForm } from "@/components/sections/BookingForm";

const BookingPage = () => {
  return (
    <div className="bg-gradient-booking py-12 pt-24">
      <main className="container mx-auto">
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-8 rounded-3xl border-4 border-pink-300 shadow-xl flex flex-col min-h-[400px] h-full max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 bg-clip-text text-transparent sm:text-5xl animate-pulse mb-6 text-center leading-tight pb-2" tabIndex={0} aria-label="Booking Request">📝 Booking Request</h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-700 font-semibold bg-white/60 rounded-2xl p-4 shadow-lg border-2 border-pink-200 mb-6 text-center">
            Fill out the form below to secure a bouncy castle for your event. We&apos;ll get back to you shortly to confirm the details.
          </p>
          <div className="flex-1 flex flex-col justify-between">
            <Suspense fallback={<div>Loading form...</div>}>
              <BookingForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingPage; 