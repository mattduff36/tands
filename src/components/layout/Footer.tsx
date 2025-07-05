import Link from "next/link";
import { Facebook } from "lucide-react";

const Footer = () => {
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/castles", label: "Our Castles" },
    { href: "/about", label: "About Us" },
    { href: "/health-and-safety", label: "Health & Safety" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  const companyInfo = {
    name: "T&S Bouncy Castle Hire",
    phone: "07835 094187",
    email: "tsbouncycastlehire@gmail.com",
    facebookUrl: "https://www.facebook.com", // Replace with actual Facebook page URL
  };

  return (
    <footer className="bg-gray-100 text-gray-700">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">{companyInfo.name}</h3>
            <p>Fun, safe, and fully insured bouncy castle hire for any occasion.</p>
            <div className="flex space-x-4">
              <a
                href={companyInfo.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-blue-600"
                aria-label="Facebook page for T&S Bouncy Castle Hire"
              >
                <Facebook className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 tracking-wider uppercase">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-base text-gray-600 hover:text-blue-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 tracking-wider uppercase">Contact Us</h3>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <a href={`tel:${companyInfo.phone}`} className="hover:text-blue-600">{companyInfo.phone}</a>
              </li>
              <li className="flex items-center">
                <a href={`mailto:${companyInfo.email}`} className="hover:text-blue-600">{companyInfo.email}</a>
              </li>
              <li>Edwinstowe, UK</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {companyInfo.name}. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 