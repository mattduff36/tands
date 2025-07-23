import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Sign In | T&S Bouncy Castle Hire",
  description: "Sign in to the T&S Admin Portal",
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}