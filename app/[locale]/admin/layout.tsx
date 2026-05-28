import { requireAdmin } from "@/lib/session";
import { redirect } from "next/navigation";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  
  try {
    await requireAdmin();
  } catch (err) {
    console.warn("[AdminLayout] Unauthorized access blocked:", err);
    redirect(`/${locale}`);
  }

  return <>{children}</>;
}
