import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedPageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} size="sm">
            <CardHeader>
              <Skeleton className="h-3 w-20" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton className="h-12 w-full rounded-md" key={index} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AuthPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
