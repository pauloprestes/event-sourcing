import { cloneDeep } from "lodash";
import { save } from "../db/db";

const allListeners = []

export interface UserCreatedEvent {
  type: 'UserCreatedEvent'
  id: string
  email: string
  name: string
}

export interface UserUpdatedEvent {
  type: 'UserUpdatedEvent',
  id: string
  name: string
}

type Events = UserCreatedEvent | UserUpdatedEvent;

const deliveryEvents = (user: Events) => {
  allListeners.forEach(listener => listener(user));
}

const saveEvents = (userEvent: Events) => save(userEvent)

export const addListener = (listener: (anEvent: Events) => void) => {
  allListeners.push(listener);
}

export const addUser = (user: UserCreatedEvent) => {
  user.type = "UserCreatedEvent"
  saveEvents(user);
  deliveryEvents(user);
}

export const updateUser = (user: UserUpdatedEvent) => {
  user.type = "UserUpdatedEvent"
  saveEvents(user);
  deliveryEvents(user);
}
