import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('🔄 Iniciando limpeza e reset total dos dados do aplicativo...');

// 1. Limpar demo-data.json
const demoDataPath = path.join(rootDir, 'backend/database/seeders/demo-data.json');
if (fs.existsSync(demoDataPath)) {
  const data = JSON.parse(fs.readFileSync(demoDataPath, 'utf-8'));
  const keysToEmpty = [
    'visitors',
    'visits',
    'parcels',
    'shifts',
    'occurrences',
    'occurrenceComments',
    'reservations',
    'agendaEvents',
    'announcements',
    'tickets',
    'ticketComments',
    'documents',
    'polls',
    'pollOptions',
    'pollVotes',
    'contracts',
    'maintenanceOrders',
    'assemblies',
    'assemblyAgenda',
    'assemblyAttendance',
    'assemblyVotes',
    'assemblyMinutes',
    'assemblyMinuteVersions',
    'transactions',
    'budgets',
    'charges',
    'lostItems',
    'moveRequests',
    'supportTickets',
    'importJobs',
    'notifications',
    'auditLogs'
  ];

  let emptied = 0;
  for (const key of keysToEmpty) {
    if (data.entities && data.entities[key]) {
      data.entities[key] = [];
      emptied++;
    }
  }
  fs.writeFileSync(demoDataPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ demo-data.json: ${emptied} coleções operacionais esvaziadas (todas as ocorrências e registros zerados).`);
}

// 2. Limpar system-incidents-store.json
const incidentsPath = path.join(rootDir, 'backend/storage/system-incidents-store.json');
if (fs.existsSync(incidentsPath)) {
  const incData = JSON.parse(fs.readFileSync(incidentsPath, 'utf-8'));
  incData.incidents = [];
  incData.activities = [];
  incData.occurrences = [];
  fs.writeFileSync(incidentsPath, JSON.stringify(incData, null, 2), 'utf-8');
  console.log('✅ system-incidents-store.json: todos os incidentes e avisos técnicos zerados.');
}

// 3. Remover pastas e arquivos de cache .storage
const storagePaths = [
  path.join(rootDir, '.storage'),
  path.join(rootDir, 'frontend/.storage'),
];

for (const p of storagePaths) {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log(`✅ Cache removido: ${p}`);
  }
}

console.log('🎉 Limpeza concluída com sucesso! Todo o app está limpo e zerado.');
