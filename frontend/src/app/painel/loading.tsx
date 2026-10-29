import { AppSkeleton } from "@/components/app-ui";

export default function PainelDashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-32 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      {/* Stats Cards Skeleton */}
      <AppSkeleton variant="stat" count={4} />

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 animate-pulse">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-64 bg-slate-100 rounded-xl" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 animate-pulse">
            <div className="h-5 w-36 bg-slate-200 rounded" />
            <div className="space-y-2">
              <div className="h-12 bg-slate-50 rounded-lg border border-slate-100" />
              <div className="h-12 bg-slate-50 rounded-lg border border-slate-100" />
              <div className="h-12 bg-slate-50 rounded-lg border border-slate-100" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 animate-pulse">
            <div className="h-5 w-28 bg-slate-200 rounded" />
            <div className="h-32 bg-slate-100 rounded-xl" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 animate-pulse">
            <div className="h-5 w-32 bg-slate-200 rounded" />
            <div className="space-y-2">
              <div className="h-10 bg-slate-50 rounded-lg" />
              <div className="h-10 bg-slate-50 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

