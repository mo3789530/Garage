import type { ReactNode } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function Panel({ title, count, children }: { title: string; count?: string; children: ReactNode }) {
  return (
    <Card className="panel">
      <CardHeader className="panel-header">
        <CardTitle>{title}</CardTitle>
        {count && <Badge>{count}</Badge>}
      </CardHeader>
      <CardContent className="list">{children}</CardContent>
    </Card>
  );
}
