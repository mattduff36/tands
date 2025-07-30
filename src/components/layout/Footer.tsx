import Link from "next/link";
import { Heart, Facebook } from "lucide-react";

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
          
          {/* Social Media Links */}
          <div className="mb-4 flex justify-center">
            <a 
              href="https://www.facebook.com/profile.php?id=61577881314560" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-300 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full border border-blue-200 hover:border-blue-300"
            >
              <Facebook className="h-5 w-5" />
              <span className="font-medium">Follow us on Facebook</span>
            </a>
          </div>
          
          {/* Legal Links */}
          <div className="mb-4 flex justify-center space-x-6 text-sm">
            <Link 
              href="/privacy" 
              className="text-gray-500 hover:text-gray-700 underline transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-gray-500 hover:text-gray-700 underline transition-colors"
            >
              Terms & Conditions
            </Link>
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