import { AlertCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-stone-50">
      <Card className="mx-4 w-full max-w-md">
        <CardContent>
          <div className="mb-4 flex gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-stone-900">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-stone-600">Did you forget to add the page to the router?</p>
        </CardContent>
      </Card>
    </div>
  );
}
