import { connectDb, disconnectDb } from './db.ts';
import { hashPassword } from './auth.ts';
import { Organization, User, Class } from './models/index.ts';

async function main() {
  await connectDb();

  let org = await Organization.findOne({ name: 'Demo musiqa maktabi' });
  if (!org) org = await Organization.create({ name: 'Demo musiqa maktabi' });

  const demoUsers: Array<{ email: string; password: string; fullName: string; role: 'student' | 'teacher' | 'content_editor' | 'admin' }> = [
    { email: 'student@example.com', password: 'student12345', fullName: 'O\u2018quvchi Demo', role: 'student' },
    { email: 'teacher@example.com', password: 'teacher12345', fullName: 'O\u2018qituvchi Demo', role: 'teacher' },
    { email: 'editor@example.com', password: 'editor12345', fullName: 'Metodist Demo', role: 'content_editor' },
    { email: 'admin@example.com', password: 'admin12345', fullName: 'Admin Demo', role: 'admin' },
  ];

  for (const u of demoUsers) {
    const exists = await User.findOne({ emailLower: u.email.toLowerCase() });
    if (exists) {
      console.log(`[seed] mavjud: ${u.email}`);
      continue;
    }
    await User.create({
      orgId: org._id,
      email: u.email,
      passwordHash: hashPassword(u.password),
      fullName: u.fullName,
      role: u.role,
    });
    console.log(`[seed] yaratildi: ${u.email} / ${u.password}`);
  }

  const teacher = await User.findOne({ emailLower: 'teacher@example.com' });
  let cls = await Class.findOne({ name: '1-sinf, A' });
  if (!cls) {
    cls = await Class.create({ orgId: org._id, name: '1-sinf, A', teacherId: teacher?._id ?? null });
    console.log('[seed] sinf yaratildi: 1-sinf, A');
  }

  console.log('\n[seed] Diqqat: kurs kontenti (content-pack.json) hali import qilinmagan.');
  console.log('[seed] Buni keyingi bosqichda content:import skripti bilan qo\u2018shamiz.');

  await disconnectDb();
}

main().catch((err) => {
  console.error('[seed] xato:', err);
  process.exit(1);
});
