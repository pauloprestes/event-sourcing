
import { MongoClient, Collection, Cursor } from 'mongodb'
import config from '../config';

export const runConnected = async <T, X>(collectionName: string, doWork: (collection: Collection<T>) => Promise<X>): Promise<X> => {
  const db = await MongoClient.connect(config.mongo_url, {
    poolSize: 10,
    reconnectTries: 60,
    reconnectInterval: 1000
  })
  const collection = db.db("testDB").collection(collectionName);
  try {
    return await doWork(collection);
  }
  finally {
    db.close();
  }
}

export const firstOrNull = async <T>(cursor: Cursor<T>) => {
  if (!await cursor.hasNext()) return null

  return await cursor.next()
}
