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

const deleteCollection = async () => {
  const db = await MongoClient.connect(config.mongo_url, {
    poolSize: 10,
    // retry to connect for 60 times
    reconnectTries: 60,
    // wait 1 second before retrying
    reconnectInterval: 1000
  })
  db.db("testDB").collection("users").drop();
  db.close();
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

const deleteOldState = () => new Promise(resolve => {
  const keepTrying = () => setTimeout(async () => {
    try {
      await deleteCollection();
      resolve();
    } catch (err) {
      console.log("Error deleting old state")
      keepTrying();
    }
  }, 100);

  keepTrying();
});

const backgroundUpdate = async () => {
  await deleteOldState();
  listNewEvents(async events => {
    await applyEventsToState(events)
  })
}


const applyEventsToState = async (allEvents: { type: String }[]) => {
  for (let i = 0; i < allEvents.length; i++) {
    const userEvent = allEvents[i];

    if (userEvent.type === "UserCreatedEvent") await addUser(userEvent as UserCreatedEvent)
    if (userEvent.type === "UserUpdatedEvent") await updateUser(userEvent as UserUpdatedEvent)
    if (userEvent.type === "UserDeletedEvent") await deleteUser(userEvent as UserDeletedEvent)
  }
}

const addUser = async (user: UserCreatedEvent) => {
  const users = await connectToDB()
  await users.insertOne({ _id: user.id, name: user.name, email: user.email, createdAt: user.addedAt })
}

const updateUser = async (user: UserUpdatedEvent) => {
  const users = await connectToDB()
  await users.updateOne(
    { _id: user.id },
    { $set: { name: user.name, lastUpdatedAt: user.addedAt } });
}

const deleteUser = async (user: UserDeletedEvent) => {
  const users = await connectToDB()
  await users.deleteOne({ _id: user.id });
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

backgroundUpdate();
