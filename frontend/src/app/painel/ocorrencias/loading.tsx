import { AppSkeleton } from "@/components/app-ui";

export default function OcorrenciasLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-40 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      <div className="flex items-center gap-3">
        <div className="h-9 w-64 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-9 w-32 bg-slate-100 rounded-xl animate-pulse" />
      </div>

      <AppSkeleton variant="feed" count={6} />
    </div>
  );
}
