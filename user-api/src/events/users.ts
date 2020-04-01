import { runConnected } from "../db";
import { Collection } from "mongodb";

interface DefaultEvent {
  addedAt: number
  id: string
  type: string
};

export interface UserCreatedEvent {
  addedAt: number
  type: 'UserCreatedEvent'
  id: string
  email: string
  name: string
}

export interface UserUpdatedEvent {
  addedAt: number
  type: 'UserUpdatedEvent'
  id: string
  name: string
}

export interface UserDeletedEvent {
  addedAt: number
  type: 'UserDeletedEvent'
  id: string
}

type Events = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent;

const saveEvents = (userEvent: Events) => save(userEvent)

export const addUser = (user: { id: string, email: string, name: string }) =>
  saveEvents({ type: "UserCreatedEvent", addedAt: Date.now(), ...user });

export const updateUser = (id: string, user: { name: string }) =>
  saveEvents({ type: "UserUpdatedEvent", id, addedAt: Date.now(), ...user });

export const deleteUser = (id: string) =>
  saveEvents({ type: "UserDeletedEvent", id, addedAt: Date.now() });


const save = async (event: { id: string, type: string }) => {
  await runConnected("events", async (events: Collection<DefaultEvent>) => {
    await events.insertOne({ ...event, addedAt: Date.now() })
  })
}

type EventNotification = (event: DefaultEvent[]) => Promise<void>;

const queryBasedOnLastAddedDate = (lastAdded: number) => {
  if (!lastAdded) return {};
  return { addedAt: { $exists: true, $gt: lastAdded } };
}

export const subscribeToNewEvents = (cursor: () => number, notify: EventNotification) => {
  const backgroundQuery = async () => {
    setTimeout(async () => {
      try {
        await runConnected("events", async (events: Collection<DefaultEvent>) => {
          const query = queryBasedOnLastAddedDate(cursor())
          const result = await events.find(query).toArray()
          if (result.length > 0) {
            await notify(result)
          }
        });
      }
      catch (err) {
        console.log("error listing new events")
      }
      finally {
        backgroundQuery()
      }
    }, 100);
  }
  backgroundQuery()
}
