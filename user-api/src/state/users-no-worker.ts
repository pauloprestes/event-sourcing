import { Collection } from 'mongodb'
import { dropCollection, runConnected } from '../db';

const USER_TABLE = "local-worker";

interface UserRecord {
  _id: string
  email: string
  name: string
  createdAt: number
  lastUpdatedAt?: number
}

export const deleteOldState = () => new Promise(resolve => {
  const keepTrying = () => setTimeout(async () => {
    try {
      await dropCollection(USER_TABLE);
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

const addUser = async (user) => runConnected(USER_TABLE, async (users: Collection<UserRecord>) =>
  users.insertOne({ _id: user.id, name: user.name, email: user.email, createdAt: user.addedAt })
);

const updateUser = async (user) => runConnected(USER_TABLE, async (users: Collection<UserRecord>) =>
  users.updateOne(
    { _id: user.id },
    { $set: { name: user.name, lastUpdatedAt: user.addedAt } })
);

const deleteUser = async (user) => runConnected(USER_TABLE, async (users: Collection<UserRecord>) =>
  users.deleteOne({ _id: user.id })
);

export const findUser = async (email: string) => runConnected(USER_TABLE, async (users: Collection<UserRecord>) => {
  const usersFound = await users.find({ email }).toArray();
  if (usersFound.length === 0) return null;

  return usersFound[0];
})

export const listUsers = async () => runConnected(USER_TABLE, async (users: Collection<UserRecord>) =>
  users.find().toArray()
)
