import React from "react";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="bg-muted/20 rounded-full p-6 mb-6">
        <Construction className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-md">
        {description}
      </p>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          This feature is coming soon! Continue prompting to build this page.
        </p>
        <p>Ask me to implement specific functionality for this section.</p>
      </div>
    </div>
  );
}
