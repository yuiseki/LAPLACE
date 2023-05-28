import "./globals.css";

export const metadata = {
  title: "LAPLACE",
  description: "Predictions by LAPLACE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
