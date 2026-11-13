import { notFound } from "next/navigation";
import "@/design/wireframes.css";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Trang /demo/* chỉ hiển thị khi NEXT_PUBLIC_SHOW_DEMO=true; mặc định ẩn (404)
  if (process.env.NEXT_PUBLIC_SHOW_DEMO !== "true") {
    notFound();
  }

  return <>{children}</>;
}
