import { Collection } from "mongodb";
import config from "./config";
import { runConnected } from "./db";
import { UserCreatedEvent, succeedUserActivation, failUserActivation, UserDeletedEvent, subscribeToNewEvents, UserActivationFailed } from "./events/users";

const UNIQUE_EMAIL = "unique_email"
const EVENTS_CURSOR = "cursors"

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

export const lastAddedEvent = () => runConnected(EVENTS_CURSOR, async (eventCursor: Collection<CursorRecord>) => {
  try {
    return (await eventCursor.findOne({ _id: "activation" })).lastAdded
  }
  catch {
    return 0
  }
})

const saveCursor = async (cursor: CursorRecord) => runConnected(EVENTS_CURSOR, async (eventCursor: Collection<CursorRecord>) => {
  try {
    await eventCursor.insertOne(cursor);
  }
  catch (err) {
    await eventCursor.updateOne({ _id: cursor._id }, { $set: cursor });
  }
});

export const startCleanTables = async () => {
  await runConnected(EVENTS_CURSOR, async (eventCursor: Collection<UniqueEmailRecord>) => {
    await eventCursor.deleteOne({ _id: "activation" });
  })
  await runConnected(UNIQUE_EMAIL, async (uniqueEmail: Collection<UniqueEmailRecord>) => {
    await uniqueEmail.deleteMany({})
  })
}

export const handleEvents = async (events) => {
  for (let i = 0; i < events.length; i++) {
    console.log(events)
    console.log(await lastAddedEvent())
    const userEvent = events[i];

    if (userEvent.type === "UserCreatedEvent") await validateUser(userEvent as UserCreatedEvent)
    if (userEvent.type === "UserActivationFailed") await deleteUser(userEvent as UserActivationFailed)
    if (userEvent.type === "UserDeletedEvent") await deleteUser(userEvent as UserDeletedEvent)

    await saveCursor({ _id: "activation", lastAdded: userEvent.addedAt });
  }
}

interface CursorRecord {
  _id: string
  lastAdded: number
}
