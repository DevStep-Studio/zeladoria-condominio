import { domainRequest, type ServicePanel } from "@/lib/api/domain";

import { requireCondo } from "@/lib/auth";
import { getMarketplaceProviders } from "@/lib/services/providers-query";
import { getCustomerHiredProviders } from "@/lib/services/payments/payment-service";
import { ServicosClient } from "./servicos-client";

export const dynamic = "force-dynamic";

export default async function ServicosPage() {
  const { session, condoId } = await requireCondo();
  const data = await domainRequest<ServicePanel>(`/servicos?condoId=${condoId}`);
  const { services: serviceRows, marketplaceRequests: mpRequests, quotes: quotesList, reviews: reviewsList, messages: messagesList, inspections: inspectionsList, paymentOrders: paymentOrdersList, addendums: addendumsList, evidences: evidencesList, vendors: vendorList, initialFavorites: userFavoriteIds, condoInfo: rawCondoInfo } = data;

  const condoInfo = { ...rawCondoInfo, address: rawCondoInfo.address ?? "", city: rawCondoInfo.city ?? "", state: rawCondoInfo.state ?? "" };

  const providers = await getMarketplaceProviders(condoId, {
    currentUserId: session.user.id,
    condoLat: condoInfo.latitude,
    condoLng: condoInfo.longitude,
  });

  let hiredProvidersList: any[] = [];
  try {
    hiredProvidersList = await getCustomerHiredProviders(session.user.id, condoId);
  } catch (err) {
    console.warn("Could not query hired providers:", err);
  }

  return (
    <ServicosClient
      services={serviceRows}
      marketplaceRequests={mpRequests}
      quotes={quotesList}
      reviews={reviewsList}
      messages={messagesList}
      inspections={inspectionsList}
      paymentOrders={paymentOrdersList}
      addendums={addendumsList}
      evidences={evidencesList}
      hiredProviders={hiredProvidersList}
      initialFavorites={userFavoriteIds}
      vendors={vendorList}
      providers={providers}
      condoInfo={condoInfo}
      canSwitchCondo={session.memberships.length > 1 || session.user.isSuperAdmin}
      role={session.role}
      currentUserId={session.user.id}
    />
  );
}
