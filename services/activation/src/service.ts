import { Collection } from "mongodb";
import config from "./config";
import { runConnected } from "./db";
import { UserCreatedEvent, succeedUserActivation, failUserActivation, UserDeletedEvent, subscribeToNewEvents, UserActivationFailed } from "./events/users";

const UNIQUE_EMAIL = "unique_email"

interface UniqueEmailRecord {
  _id: string
  email: string
  lastUpdated: number
}

const replayGateway = <T>(func: () => T) => {
  if (!config.replaying) return func()
}

const saveUser = async (uniqueEmailRecord: UniqueEmailRecord) => {
  await runConnected(UNIQUE_EMAIL, async (uniqueEmail: Collection<UniqueEmailRecord>) => {
    await uniqueEmail.createIndex({ email: 1 }, { unique: true })
    await uniqueEmail.createIndex({ lastUpdated: 1 }, { unique: false })
    await uniqueEmail.insertOne(uniqueEmailRecord)
  })
}

const validateUser = async (event: UserCreatedEvent) => {
  try {
    await saveUser({ _id: event.id, email: event.email, lastUpdated: event.addedAt })
    await replayGateway(() => succeedUserActivation(event.id));
  }
  catch{
    await replayGateway(() => failUserActivation(event.id));
  }
}

const deleteUser = async (event: { id: string }) => await runConnected(UNIQUE_EMAIL, async (uniqueEmail: Collection<UniqueEmailRecord>) =>
  await uniqueEmail.deleteOne({ _id: event.id })
)

let lastAdded = 0
export const lastAddedEvent = () => runConnected(UNIQUE_EMAIL, async (uniqueEmail: Collection<UniqueEmailRecord>) => {
  const cursor = uniqueEmail.find({ lastUpdated: { $gt: lastAdded } }).sort({ lastUpdated: -1 })
  if (!await cursor.hasNext()) return lastAdded

  lastAdded = (await cursor.next()).lastUpdated
  return lastAdded
})

export const startCleanTables = async () => runConnected(UNIQUE_EMAIL, async (uniqueEmail: Collection<UniqueEmailRecord>) => {
  await uniqueEmail.drop()
})

export const handleEvents = async (events) => {
  for (let i = 0; i < events.length; i++) {
    const userEvent = events[i];

    if (userEvent.type === "UserCreatedEvent") await validateUser(userEvent as UserCreatedEvent)
    if (userEvent.type === "UserActivationFailed") await deleteUser(userEvent as UserActivationFailed)
    if (userEvent.type === "UserDeletedEvent") await deleteUser(userEvent as UserDeletedEvent)
  }
}
