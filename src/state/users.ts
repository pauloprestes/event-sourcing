import { UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent } from "../events/users"
import { listAll, listNewEvents } from "../db/db";

interface UserRecord {
  _id: string
  email: string
  name: string
  createdAt: number
  lastUpdatedAt?: number
}

import { MongoClient, Collection } from 'mongodb'

var url = "mongodb://localhost:27017/testDB";

const deleteCollection = async () => MongoClient.connect(url, { poolSize: 10 }, function (err, db) {
  if (err) throw err;
  db.db("testDB").collection("users").drop();
  db.close();
})

const connectToDB = async () => new Promise<Collection<UserRecord>>(resolve => MongoClient.connect(url, { poolSize: 10 }, function (err, db) {
  if (err) throw err;
  resolve(db.db("testDB").collection("users"));
}))


const backgroundUpdate = async () => {
  deleteCollection();
  applyEventsToState(await listAll());
  await listNewEvents(async events => {
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
  users.insertOne({ _id: user.id, name: user.name, email: user.email, createdAt: user.addedAt }, function (err) {
    if (err) throw err;
  });
}

const updateUser = async (user: UserUpdatedEvent) => {
  const users = await connectToDB()
  users.updateOne(
    { _id: user.id },
    { $set: { name: user.name, lastUpdatedAt: user.addedAt } });
}

const deleteUser = async (user: UserDeletedEvent) => {
  const users = await connectToDB()
  users.deleteOne({ _id: user.id });
}

export const findUser = async (email: string) => {
  const users = await connectToDB()
  const cursor = users.find({ email });
  if (!cursor.hasNext()) return null;

  return cursor.next();
}

backgroundUpdate();
