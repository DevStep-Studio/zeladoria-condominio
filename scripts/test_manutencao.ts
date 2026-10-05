import { createHmac } from "node:crypto";

const SECRET = "gestao-condominio-dev-secret";
const maxAge = 60 * 60 * 24 * 30 * 1000;

function makeCookie(userId: number, condoId = 1) {
  const expires = Date.now() + maxAge;
  const payload = `${userId}.${expires}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 32);
  return `gc_session=${payload}.${sig}; gc_condo=${condoId}`;
}

async function testManutencao() {
  const users = [
    { id: 1, name: "Superadmin (Rafael)" },
    { id: 2, name: "Síndica (Marina)" },
    { id: 3, name: "Zelador (Roberto)" },
    { id: 4, name: "Porteiro (Carlos)" },
    { id: 5, name: "Conselheira (Lucia)" },
    { id: 6, name: "Prestador (Carlos Volt)" },
    { id: 7, name: "Moradora (Ana)" },
  ];

  for (const u of users) {
    try {
      const res = await fetch("http://localhost:3000/painel/manutencao", {
        headers: { Cookie: makeCookie(u.id) },
        redirect: "manual",
      });
      console.log(`${u.name}: status = ${res.status} ${res.headers.get("location") || ""}`);
      if (res.status === 500) {
        const text = await res.text();
        console.log("500 Error body snippet:", text.slice(0, 400));
      }
    } catch (e: any) {
      console.error(`Fetch error for ${u.name}:`, e.message);
    }
  }
}

testManutencao().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
