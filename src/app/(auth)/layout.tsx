export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="auth-backdrop min-h-screen">{children}</div>;
}
