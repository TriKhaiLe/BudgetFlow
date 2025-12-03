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
  description: string;
  storageKey: string;
  children: React.ReactNode;
};

export function CollapsibleCard({
  title,
  description,
  storageKey,
  children,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useLocalStorage(storageKey, true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <div className="flex w-full cursor-pointer items-center justify-between p-6">
            <div className="grid gap-2">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
