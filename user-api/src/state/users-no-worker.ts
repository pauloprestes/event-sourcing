import { Collection } from 'mongodb'
import { runConnected, firstOrNull } from '../db';

const USER_TABLE = "users";
const PENDING_USERS = "pending_users"

interface UserRecord {
  _id: string
  email: string
  name: string
  createdAt: number
  lastUpdatedAt?: number
}


export const startCleanTables = async () => {
  await runConnected(USER_TABLE, async (users: Collection<UserRecord>) => {
    await users.deleteMany({})
  })
  await runConnected(PENDING_USERS, async (pendingUsers: Collection<UserRecord>) => {
    await pendingUsers.deleteMany({})
  })
}

export const applyEventsToState = async (allEvents: { type: String }[]) => {
  console.log(allEvents)
  for (let i = 0; i < allEvents.length; i++) {
    const userEvent = allEvents[i];

    if (userEvent.type === "UserCreatedEvent") await addUser(userEvent)
    if (userEvent.type === "UserActivationSucceed") await activateUser(userEvent)
    if (userEvent.type === "UserActivationFailed") await failedToActivate(userEvent)
    if (userEvent.type === "UserUpdatedEvent") await updateUser(userEvent)
    if (userEvent.type === "UserDeletedEvent") await deleteUser(userEvent)
  }
}

const addUser = async (user) => runConnected(PENDING_USERS, async (pendingUsers: Collection<UserRecord>) =>
  pendingUsers.insertOne({ _id: user.id, name: user.name, email: user.email, createdAt: user.addedAt })
);

const updateUser = async (user) => runConnected(USER_TABLE, async (users: Collection<UserRecord>) =>
  users.updateOne(
    { _id: user.id },
    { $set: { name: user.name, lastUpdatedAt: user.addedAt } })
);

const activateUser = async (userActivationSucceed) => {
  const pendingUser = await runConnected(PENDING_USERS, async (pendingUsers: Collection<UserRecord>) => firstOrNull(pendingUsers.find({ _id: userActivationSucceed.id })))
  if (!pendingUser) return

  await runConnected(USER_TABLE, async (users: Collection<UserRecord>) => users.insertOne(pendingUser));

  await runConnected(PENDING_USERS, async (pendingUsers: Collection<UserRecord>) => pendingUsers.deleteOne({ _id: userActivationSucceed.id }));
}

const failedToActivate = async (user) => runConnected(USER_TABLE, async (users: Collection<UserRecord>) =>
  users.deleteOne({ _id: user.id })
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
