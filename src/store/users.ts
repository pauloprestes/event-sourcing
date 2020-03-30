import { addListener } from "../events/users"
import { UserCreatedEvent } from "../events/createdEvent"
import { cloneDeep } from "lodash";

const store = []

const addUser = (user: UserCreatedEvent) => {
  store.push(cloneDeep(user));
}

const updateUser = (user: UserCreatedEvent) => {
  const userStore = store.find((userStored => userStored.id === user.id));
  if (!userStore) return;

  userStore.name = user.name
}

export const findUser = (email: string) =>
  store.find(user => user.email === email)

addListener(addUser);
addListener(updateUser);
