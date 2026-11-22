import { InternalLoadingSkeleton } from "@/components/internal/internal-ui";

export default function OcorrenciasLoading() {
  return <InternalLoadingSkeleton statCount={4} rowsCount={5} />;
}
