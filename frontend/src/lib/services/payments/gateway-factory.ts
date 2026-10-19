import { AsaasGatewayAdapter } from "./asaas-adapter";
import { GatewayProvider, PaymentGatewayAdapter } from "./types";

let asaasInstance: AsaasGatewayAdapter | null = null;

export function getPaymentGateway(provider: GatewayProvider = "asaas"): PaymentGatewayAdapter {
  if (provider === "asaas") {
    if (!asaasInstance) {
      asaasInstance = new AsaasGatewayAdapter();
    }
    return asaasInstance;
  }

  // Se outros provedores forem solicitados futuramente, lançar erro ou fallback
  throw new Error(`Provedor de gateway '${provider}' ainda não está habilitado.`);
}
