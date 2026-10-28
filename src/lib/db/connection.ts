import mongoose from "mongoose";

type MongooseCache = { connection: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalForMongoose = globalThis as typeof globalThis & { mongooseCache?: MongooseCache };
const cache = globalForMongoose.mongooseCache ?? { connection: null, promise: null };
globalForMongoose.mongooseCache = cache;

export async function connectToDatabase() {
  if (cache.connection) return cache.connection;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured.");
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== "production",
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    }).then((connection) => connection).catch((error: unknown) => {
      cache.promise = null;
      throw error;
    });
  }
  cache.connection = await cache.promise;
  return cache.connection;
}
