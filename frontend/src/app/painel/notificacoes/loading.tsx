import { InternalLoadingSkeleton } from "@/components/internal/internal-ui";

export default function NotificacoesLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <InternalLoadingSkeleton stats={0} rows={5} />
    </div>
  );
}

