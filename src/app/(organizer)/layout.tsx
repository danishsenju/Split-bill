import BottomNav from "@/components/organizer/BottomNav";
import TopNav from "@/components/organizer/TopNav";
import SplashWrapper from "@/components/ui/SplashWrapper";
import { LanguageProvider } from "@/lib/language-context";

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-dvh flex flex-col bg-bg-primary">
        <SplashWrapper />
        <TopNav />
        <main className="flex-1 pb-20 md:pb-10 md:pt-[60px]">
          <div className="max-w-2xl mx-auto">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </LanguageProvider>
  );
}
