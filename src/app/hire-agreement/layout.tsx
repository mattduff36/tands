import { Toaster } from "@/components/ui/sonner";

interface HireAgreementLayoutProps {
  children: React.ReactNode;
}

export default function HireAgreementLayout({ children }: HireAgreementLayoutProps) {
  // Return children without navbar or footer - standalone layout
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}