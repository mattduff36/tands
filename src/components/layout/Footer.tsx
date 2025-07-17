import Link from "next/link";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 text-gray-600 border-t border-gray-200">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-800">
              T&S Bouncy Castle Hire
            </p>
            <p className="text-sm text-gray-600">
              Making parties unforgettable since 2024
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <p>
              Website developed with{" "}
              <Heart className="inline h-4 w-4 text-red-500" />{" "}
              by{" "}
              <a
                href="https://mpdee.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                mpdee.co.uk
              </a>{" "}
              © 2025. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 