import "./globals.css";

export const metadata = {
  title: "DAYS - CKC",
  description: "ระบบบันทึกการลา CKC Design Studio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
