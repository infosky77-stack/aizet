import { PrintAdminSidebar } from '@/components/print/PrintAdminSidebar';

export default function PrintAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      <PrintAdminSidebar />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
