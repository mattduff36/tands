import { BookingForm } from "@/components/sections/BookingForm";
import { Suspense } from "react";

const BookingPageContent = () => {
    return (
        <div className="bg-white">
            <main>
                {/* Header */}
                <div className="bg-gray-50 py-16 sm:py-20 text-center">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                            Book Your Bouncy Castle
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                            Complete the form below to request your booking. We'll confirm availability and get back to you as soon as possible.
                        </p>
                    </div>
                </div>

                {/* Booking Form Section */}
                <div className="container mx-auto py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl mx-auto bg-gray-50 p-8 rounded-lg shadow-md">
                        <BookingForm />
                    </div>
                </div>
            </main>
        </div>
    );
}

const BookingPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookingPageContent />
        </Suspense>
    );
};

export default BookingPage; 