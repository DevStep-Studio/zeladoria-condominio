import { AppSkeleton } from "@/components/app-ui";

export default function NotificacoesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 max-w-4xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="h-7 w-56 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-80 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-44 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <div className="h-8 w-20 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
      </div>

      {/* Feed Skeleton */}
      <AppSkeleton variant="feed" count={5} />
    </div>
  );
}
