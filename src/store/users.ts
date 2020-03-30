import { addListener, UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent, deletedListener, updatedListener } from "../events/users"
import { listAll } from "../db/db";

let store = [];

const rebuildStore = (allEvents: { type: String }[]) => {
  allEvents.forEach(userEvent => {
    if (userEvent.type === "UserCreatedEvent") addUser(userEvent as UserCreatedEvent)
    if (userEvent.type === "UserUpdatedEvent") updateUser(userEvent as UserUpdatedEvent)
    if (userEvent.type === "UserDeletedEvent") deleteUser(userEvent as UserDeletedEvent)
  })
}

const addUser = (user: UserCreatedEvent) => {
  store.push({ id: user.id, name: user.id, email: user.email });
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

addListener((addUser));
updatedListener(updateUser);
deletedListener(deleteUser);

listAll().then(data => rebuildStore(data));
