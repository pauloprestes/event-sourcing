import { UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent } from "../events/users"
import { listAll, listNewEvents } from "../db/db";

interface User {
  id: string
  email: string
  name: string
  createdAt: number
  lastUpdatedAt?: number
}

let store: User[] = [];

const backgroundUpdate = async () => {
  rebuildStore(await listAll());
  await listNewEvents(events => {
    rebuildStore(events)
  })
}


const rebuildStore = (allEvents: { type: String }[]) => {
  allEvents.forEach(userEvent => {
    if (userEvent.type === "UserCreatedEvent") addUser(userEvent as UserCreatedEvent)
    if (userEvent.type === "UserUpdatedEvent") updateUser(userEvent as UserUpdatedEvent)
    if (userEvent.type === "UserDeletedEvent") deleteUser(userEvent as UserDeletedEvent)
  })
}

const addUser = (user: UserCreatedEvent) => {
  store = [...store, { id: user.id, name: user.name, email: user.email, createdAt: user.addedAt }];
}

const updateUser = (user: UserUpdatedEvent) => {
  const userStore = store.find((userStored => userStored.id === user.id));
  if (!userStore) return;

  userStore.name = user.name
  userStore.lastUpdatedAt = user.addedAt
}

const deleteUser = (user: UserDeletedEvent) => {
  store = store.filter((userStored => userStored.id !== user.id));
}

export const findUser = (email: string) =>
  store.find(user => user.email === email)

backgroundUpdate();
