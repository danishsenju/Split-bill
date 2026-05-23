import BottomNav from "@/components/organizer/BottomNav";

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
