import { UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent } from "../events/users"
import { listNewEvents } from "../db/db";
import { MongoClient, Collection } from 'mongodb'
import config from "../config";

interface UserRecord {
  _id: string
  email: string
  name: string
  createdAt: number
  lastUpdatedAt?: number
}

const connectToDB = async (): Promise<Collection<UserRecord>> => {
  const db = await MongoClient.connect(config.mongo_url, {
    poolSize: 10,
    // retry to connect for 60 times
    reconnectTries: 60,
    // wait 1 second before retrying
    reconnectInterval: 1000
  })
  return db.db("testDB").collection("users");
}

export const findUser = async (email: string) => {
  const users = await connectToDB()
  const cursor = users.find({ email });
  if (!cursor.hasNext()) return null;

  return cursor.next();
}

export const listUsers = async () => {
  const users = await connectToDB()
  return users.find().toArray();
}
