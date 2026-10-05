import { db } from "../src/db";
import { amenities } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const rows = await db.select().from(amenities);
  for (const a of rows) {
    let category = "outro";
    let desc = "Área comum de convivência e lazer.";
    let img = "/amenities/salao-festas.jpg";
    let feats: string[] = ["wifi", "banheiro", "acessibilidade"];
    let deposit = 0;
    let pricingType = a.feeCents && a.feeCents > 0 ? "fixo" : "gratis";
    let model = "horario_livre";
    let advanceMin = 2;
    let advanceMax = 60;
    let limitUnit = 2;
    let limitInt = "mes";
    let cancelH = 24;

    const lower = a.name.toLowerCase();
    if (lower.includes("churrasq")) {
      category = "churrasqueira";
      desc = "Área externa com churrasqueira a carvão, bancada de apoio em granito e vista privilegiada para o jardim.";
      img = "/amenities/churrasqueira.jpg";
      feats = ["churrasqueira", "geladeira", "mesas", "cadeiras", "banheiro", "wifi"];
      pricingType = "fixo";
      advanceMin = 4;
      limitUnit = 4;
      cancelH = 24;
    } else if (lower.includes("festa") || lower.includes("salão") || lower.includes("salao")) {
      category = "salao";
      desc = "Espaço sofisticado e climatizado, ideal para celebrações familiares, jantares e aniversários inesquecíveis.";
      img = "/amenities/salao-festas.jpg";
      feats = ["wifi", "ar_condicionado", "cozinha", "geladeira", "mesas", "cadeiras", "banheiro", "acessibilidade"];
      pricingType = "fixo";
      deposit = 30000;
      model = "periodo_unico";
      advanceMin = 24;
      advanceMax = 90;
      limitUnit = 2;
      cancelH = 48;
    } else if (lower.includes("quadra") || lower.includes("esporte")) {
      category = "quadra";
      desc = "Quadra com piso emborrachado para futsal, basquete e vôlei com iluminação em LED.";
      img = "/amenities/quadra.jpg";
      feats = ["iluminacao", "vestiario", "acessibilidade"];
      pricingType = "gratis";
      model = "slot_fixo";
      advanceMin = 1;
      advanceMax = 30;
      limitUnit = 3;
      limitInt = "semana";
      cancelH = 2;
    } else if (lower.includes("coworking") || lower.includes("reuni")) {
      category = "coworking";
      desc = "Ambiente silencioso, mesas ergonômicas, sala de reunião privativa e internet fibra dedicada.";
      img = "/amenities/coworking.jpg";
      feats = ["wifi", "ar_condicionado", "tomadas", "tv", "cafe", "banheiro"];
      pricingType = "gratis";
      model = "horario_livre";
      advanceMin = 1;
      advanceMax = 30;
      limitUnit = 5;
      limitInt = "semana";
      cancelH = 2;
    } else if (lower.includes("kids") || lower.includes("play")) {
      category = "playground";
      desc = "Brinquedoteca interna com piso anti-impacto e brinquedos lúdicos higienizados diariamente.";
      img = "/amenities/salao-festas.jpg";
      feats = ["ar_condicionado", "brinquedos", "banheiro", "acessibilidade"];
      pricingType = "gratis";
      model = "horario_livre";
      advanceMin = 1;
      advanceMax = 30;
      limitUnit = 4;
      limitInt = "semana";
      cancelH = 2;
    } else if (lower.includes("piscina")) {
      category = "piscina";
      desc = "Piscina aquecida com raia semiolímpica e deck molhado.";
      img = "/amenities/piscina.jpg";
      feats = ["espreguicadeiras", "ducha", "banheiro", "acessibilidade"];
      pricingType = "gratis";
    }

    await db
      .update(amenities)
      .set({
        category,
        description: desc,
        images: [img],
        features: feats,
        depositCents: deposit,
        pricingType,
        reservationModel: model,
        minAdvanceHours: advanceMin,
        maxAdvanceDays: advanceMax,
        limitPerUnit: limitUnit,
        limitInterval: limitInt,
        cancellationDeadlineHours: cancelH,
      })
      .where(eq(amenities.id, a.id));
  }
  console.log("Amenities enriched successfully!");
  process.exit(0);
}

main().catch(console.error);
