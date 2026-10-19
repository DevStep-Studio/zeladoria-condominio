import { domainRequest } from "@/lib/api/server";

import { requireCondo } from "@/lib/auth";

import { PageHeader } from "@/components/ui";
import { unitOptions } from "@/lib/queries";
import { PrintButton } from "@/components/client-bits";
import { AssembliesClientView } from "@/components/assembly-client";

export const dynamic = "force-dynamic";

export default async function AssembleiasPage() {
  const { session, condoId } = await requireCondo();

  const {
    visibleAssemblies,
    agenda,
    attendance,
    votes,
    minutesList,
    versions,
    condoBlocks,
  } = await domainRequest<{
    visibleAssemblies: any[];
    agenda: any[];
    attendance: any[];
    votes: any[];
    minutesList: any[];
    versions: any[];
    condoBlocks: any[];
  }>("/painel/assembleias", { query: { condoId, role: session.role } });

  const unitList = await unitOptions(condoId);

  return (
    <>
      <PageHeader
        title="Assembleias"
        subtitle="Convocação digital, pautas, confirmações de presença, atas, resumos e controle de versão de documentos de assembleias."
        actions={<PrintButton label="Imprimir relatórios" />}
      />

      <AssembliesClientView
        session={{
          role: session.role,
          user: { id: session.user.id, name: session.user.name },
          unitId: session.unitId ?? null,
        }}
        assemblies={visibleAssemblies}
        agendaItems={agenda}
        attendances={attendance}
        votes={votes}
        minutesList={minutesList}
        minuteVersions={versions}
        unitOptions={unitList}
        blocks={condoBlocks}
      />
    </>
  );
}
