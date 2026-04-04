import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedPageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="app-page-accent space-y-3 rounded-[28px] border border-border/70 p-6">
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-4 w-[38rem] max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} size="sm">
            <CardHeader>
              <Skeleton className="h-3 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="space-y-3">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton className="h-14 w-full rounded-2xl" key={index} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AuthPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-3">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-10 w-56 max-w-full" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
