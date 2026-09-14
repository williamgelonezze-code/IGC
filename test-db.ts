import { db } from './src/db';
import { auditReports } from './src/db/schema';

async function main() {
  try {
    const [newReport] = await db.insert(auditReports).values({
      fileName: 'Test',
      fileData: 'Base64...',
      validatorCpf: '1234',
      validatorRe: '1234',
      ipAddress: 'A'.repeat(50),
      metadata: {},
    }).returning({ id: auditReports.id });
    console.log('Success:', newReport);
  } catch (err: any) {
    console.error('Insert error details:', err);
  }
}
main();
