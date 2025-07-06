"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/castles", label: "Our Castles" },
    { href: "/about", label: "About Us" },
    { href: "/health-and-safety", label: "Health & Safety" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  const mobileBarLinks = navLinks.filter((link) =>
    ["Home", "Our Castles", "Contact"].includes(link.label),
  );
  const mobileMenuLinks = navLinks.filter(
    (link) => !["Home", "Our Castles", "Contact"].includes(link.label),
  );

  const handleMenuToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="bg-gradient-nav shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between md:justify-center h-20">
          <nav className="flex md:hidden items-center space-x-4 ml-2">
            {mobileBarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors text-base font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Button asChild>
              <Link href="/booking">Book Now</Link>
            </Button>
          </nav>
          <div className="md:hidden flex items-center">
            <button
              onClick={handleMenuToggle}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {mobileMenuLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4">
              <Button asChild className="w-full">
                <Link href="/booking">Book Now</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar; 