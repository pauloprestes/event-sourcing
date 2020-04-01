
import { MongoClient, Collection } from 'mongodb'
import config from '../config';


export const runConnected = async <T, X>(collectionName: string, doWork: (collection: Collection<T>) => Promise<X>): Promise<X> => {
  const db = await MongoClient.connect(config.mongo_url, {
    poolSize: 10,
    // retry to connect for 60 times
    reconnectTries: 60,
    // wait 1 second before retrying
    reconnectInterval: 1000
  })
  const collection = db.db("testDB").collection(collectionName);
  const result = await doWork(collection);
  db.close();
  return result;
}

export const dropCollection = async (collectionName: string) => {
  const db = await MongoClient.connect(config.mongo_url, {
    poolSize: 10,
    // retry to connect for 60 times
    reconnectTries: 60,
    // wait 1 second before retrying
    reconnectInterval: 1000
  })
  db.db("testDB").collection(collectionName).drop();
  db.close();
}
