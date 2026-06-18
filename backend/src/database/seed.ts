import { AppDataSource } from './data-source';
import * as bcrypt from 'bcrypt';

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱 Seeding database...');

  const userRepo = AppDataSource.getRepository('users');
  const configRepo = AppDataSource.getRepository('configuracao_sistema');

  // Admin user
  const existingAdmin = await userRepo.findOne({ where: { email: 'admin@opinia.com' } });
  if (!existingAdmin) {
    const hash = await bcrypt.hash('admin123', 10);
    await userRepo.save({ email: 'admin@opinia.com', password: hash, role: 'admin' });
    console.log('✅ Admin user: admin@opinia.com / admin123');
  }

  // System config
  const existingConfig = await configRepo.findOne({ where: {} });
  if (!existingConfig) {
    await configRepo.save({
      nomePlataforma: 'Opinia',
      textoInstitucional: 'Plataforma de Pesquisa de Opinião Pública e Inteligência Municipal.',
      rodapePadrao: 'Opinia — Plataforma de Pesquisa de Opinião Pública. Todos os direitos reservados.',
      publicUrl: process.env.PUBLIC_URL || 'http://localhost:4200',
    });
    console.log('✅ System config created');
  }

  console.log('🎉 Seed complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
