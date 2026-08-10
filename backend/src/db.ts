import mongoose from 'mongoose';
import { config } from './config.ts';

export async function connectDb(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(config.mongoUri);
  console.log(`[db] MongoDB'ga ulandi: ${conn.connection.name}`);
  return conn;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
