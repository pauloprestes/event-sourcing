import { addListener, UserCreatedEvent, UserUpdatedEvent } from "../events/users"
import { listAll } from "../db/db";

const store = [];

const rebuildStore = (allEvents: { type: String }[]) => {
  allEvents.forEach(userEvent => {
    if (userEvent.type === "UserCreatedEvent") addUser(userEvent as UserCreatedEvent)
    if (userEvent.type === "UserUpdatedEvent") updateUser(userEvent as UserUpdatedEvent)
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

export const findUser = (email: string) =>
  store.find(user => user.email === email)

addListener(addUser);
addListener(updateUser);

listAll().then(data => rebuildStore(data));
