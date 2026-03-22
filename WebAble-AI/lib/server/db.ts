import mongoose from "mongoose";
import { requireEnv } from "@/lib/server/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

type GlobalWithMongooseCache = typeof globalThis & {
  __mongooseCache__?: MongooseCache;
};

const globalForMongoose = globalThis as GlobalWithMongooseCache;

const globalCache = globalForMongoose.__mongooseCache__ ?? {
  conn: null,
  promise: null,
};

if (!globalForMongoose.__mongooseCache__) {
  globalForMongoose.__mongooseCache__ = globalCache;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    const uri = requireEnv("MONGODB_URI");
    globalCache.promise = mongoose.connect(uri).then((instance) => instance);
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}
