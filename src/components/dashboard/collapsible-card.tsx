'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

type CollapsibleCardProps = {
  title: string;
  storageKey: string;
  children: React.ReactNode;
  action?: React.ReactNode;
};

export function CollapsibleCard({
  title,
  storageKey,
  children,
  action,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useLocalStorage(storageKey, true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <div className="flex w-full items-center justify-between p-6">
          <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer group">
            <div className="grid gap-2">
              <CardTitle>{title}</CardTitle>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform group-hover:text-foreground ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </CollapsibleTrigger>
          {action && <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>{action}</div>}
        </div>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
