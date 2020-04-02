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

export interface UserActivationFailed {
  addedAt: number
  type: 'UserActivationFailed'
  id: string
}

export interface UserActivationSucceed {
  addedAt: number
  type: 'UserActivationSucceed'
  id: string
}

type Events = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent | UserActivationFailed | UserActivationSucceed;

const saveEvents = (userEvent: Events) => save(userEvent)

export const addUser = (user: { id: string, email: string, name: string }) =>
  saveEvents({ type: "UserCreatedEvent", addedAt: Date.now(), ...user });

export const updateUser = (id: string, user: { name: string }) =>
  saveEvents({ type: "UserUpdatedEvent", id, addedAt: Date.now(), ...user });

export const deleteUser = (id: string) =>
  saveEvents({ type: "UserDeletedEvent", id, addedAt: Date.now() });

export const failUserActivation = (id: string) =>
  saveEvents({ type: "UserActivationFailed", id, addedAt: Date.now() });

export const succeedUserActivation = (id: string) =>
  saveEvents({ type: "UserActivationSucceed", id, addedAt: Date.now() });


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

export const subscribeToNewEvents = (cursor: () => Promise<number>, notify: EventNotification) => {
  const backgroundQuery = async () => {
    setTimeout(async () => {
      try {
        await runConnected("events", async (events: Collection<DefaultEvent>) => {
          const query = queryBasedOnLastAddedDate(await cursor())
          const result = await events.find(query).toArray()
          if (result.length > 0) {
            await notify(result)
          }
        });
      }
      catch (err) {
        console.log(err)
        console.log("error listing new events")
      }
      finally {
        backgroundQuery()
      }
    }, 100);
  }
  backgroundQuery()
}

export const subscribeToEvent = (id: string, ...eventTypes: string[]) => new Promise<DefaultEvent>((resolve, reject) => {
  const query = { id: { $eq: id }, $or: eventTypes.map(eventType => ({ type: eventType })) }
  const timeout = 3000 //3 seconds

  let subscribeTimeout = false;
  const timeoutFunc = setTimeout(() => {
    subscribeTimeout = true
  }, timeout);

  const backgroundQuery = async () => {
    if (subscribeTimeout) {
      reject(new Error("Subscribe to event has timeout"))
      return
    }

    setTimeout(async () => {
      try {
        await runConnected("events", async (events: Collection<DefaultEvent>) => {
          const result = await events.findOne(query);
          if (result) {
            resolve(result)
            clearTimeout(timeoutFunc);
            return;
          }
        })
      }
      catch (err) {
        console.log("error listing new events")
        reject(err);
        clearTimeout(timeoutFunc);
        return
      }

      backgroundQuery()
    }, 100);
  }

  backgroundQuery()
});
