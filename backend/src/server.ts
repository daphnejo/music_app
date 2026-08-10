import { createApp } from './app.ts';
import { connectDb } from './db.ts';
import { config } from './config.ts';

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[server] http://127.0.0.1:${config.port} da ishga tushdi (${config.isProd ? 'production' : 'development'})`);
  });
}

main().catch((err) => {
  console.error('[server] ishga tushmadi:', err);
  process.exit(1);
});
