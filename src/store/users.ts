import { UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent, deletedListener, updatedListener } from "../events/users"
import { listAll, listNewEvents } from "../db/db";

interface User {
  Id: string
  Email: string
  Name: string
}
let store = [];

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
  store = [...store, { id: user.id, name: user.name, email: user.email }];
}

const updateUser = (user: UserUpdatedEvent) => {
  const userStore = store.find((userStored => userStored.id === user.id));
  if (!userStore) return;

  userStore.name = user.name
}

const deleteUser = (user: UserDeletedEvent) => {
  store = store.filter((userStored => userStored.id !== user.id));
}

export const findUser = (email: string) =>
  store.find(user => user.email === email)

backgroundUpdate();
