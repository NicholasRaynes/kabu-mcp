import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthCardProps {
  title?: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

/** Shared centered page layout with the logo at the top of the card. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-white p-4">
      <Card className="w-full max-w-sm shadow-none">
        <CardHeader className="justify-items-center text-center">
          <img src="/kabu-mcp-logo.png" alt="kabu mcp" className="mb-4 h-8 w-auto" />
          {title && <CardTitle className="text-xl">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        {children && <CardContent className="grid gap-6">{children}</CardContent>}
        {footer && (
          <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter>
        )}
      </Card>
    </main>
  );
}
