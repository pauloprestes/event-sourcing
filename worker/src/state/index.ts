import { subscribeToNewEvents } from "../events";
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

export const deleteOldState = () => new Promise(resolve => {
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


export const applyEventsToState = async (allEvents: { type: String }[]) => {
  for (let i = 0; i < allEvents.length; i++) {
    const userEvent = allEvents[i];

    if (userEvent.type === "UserCreatedEvent") await addUser(userEvent)
    if (userEvent.type === "UserUpdatedEvent") await updateUser(userEvent)
    if (userEvent.type === "UserDeletedEvent") await deleteUser(userEvent)
  }
}

const addUser = async (user) => {
  const users = await connectToDB()
  await users.insertOne({ _id: user.id, name: user.name, email: user.email, createdAt: user.addedAt })
}

const updateUser = async (user) => {
  const users = await connectToDB()
  await users.updateOne(
    { _id: user.id },
    { $set: { name: user.name, lastUpdatedAt: user.addedAt } });
}

const deleteUser = async (user) => {
  const users = await connectToDB()
  await users.deleteOne({ _id: user.id });
}
