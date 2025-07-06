import Link from "next/link";
import { Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-footer text-gray-800">
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-gray-600">
          <p>
            Website developed by{" "}
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
    </footer>
  );
};

export default Footer; 