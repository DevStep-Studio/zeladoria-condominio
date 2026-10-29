import { AppSkeleton } from "@/components/app-ui";

export default function MoradoresLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="h-7 w-60 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-80 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      <AppSkeleton variant="stat" count={4} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AppSkeleton variant="table" count={6} />
        </div>
        <div>
          <AppSkeleton variant="card" count={2} />
        </div>
      </div>
    </div>
  );
}

