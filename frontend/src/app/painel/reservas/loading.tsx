import { AppSkeleton } from "@/components/app-ui";

export default function ReservasLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs animate-pulse">
            <div className="h-44 bg-slate-200" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-8 w-24 bg-slate-200 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

