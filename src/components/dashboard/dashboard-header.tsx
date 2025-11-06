'use client';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { AIAssistantDialog } from './ai-assistant-dialog';
import { DataManagement } from './data-management';

export default function DashboardHeader() {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Logo />
      </nav>
      {/* Mobile header can be added here if needed */}
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          <div className="flex items-center gap-2">
            <AIAssistantDialog />
            <DataManagement />
          </div>
        </div>
      </div>
    </header>
  );
}
