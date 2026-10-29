import { AppSkeleton } from "@/components/app-ui";

export default function FinanceiroLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      <AppSkeleton variant="stat" count={4} />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        <div className="h-48 bg-slate-50 rounded-xl" />
      </div>

      <AppSkeleton variant="table" count={5} />
    </div>
  );
}
