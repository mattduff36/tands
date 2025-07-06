import { Suspense } from 'react';
import { BookingForm } from "@/components/sections/BookingForm";

const BookingPage = () => {
  return (
    <div className="bg-gradient-booking py-12">
      <main className="container mx-auto">
        <div className="rounded-xl border bg-white/30 p-8 shadow-lg backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Book Your Bouncy Castle
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              Fill out the form below to secure a bouncy castle for your event. We&apos;ll get back to you shortly to confirm the details.
            </p>
          </div>
          <div className="mt-12 max-w-4xl mx-auto">
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