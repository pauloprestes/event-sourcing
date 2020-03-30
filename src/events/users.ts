import { cloneDeep } from "lodash";
import { save } from "../db/db";

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

export interface UserDeletedEvent {
  type: 'UserDeletedEvent',
  id: string
}

type Events = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent;

const saveEvents = (userEvent: Events) => save(userEvent)

const addListeners = []
export const addListener = (listener: (anEvent: UserCreatedEvent) => void) => {
  addListeners.push(listener);
}

const updatedListeners = []
export const updatedListener = (listener: (anEvent: UserUpdatedEvent) => void) => {
  updatedListeners.push(listener);
}

const deletedListeners = []
export const deletedListener = (listener: (anEvent: UserDeletedEvent) => void) => {
  deletedListeners.push(listener);
}

export const addUser = (user: UserCreatedEvent) => {
  saveEvents(user);
  addListeners.forEach(listener => listener(user));
}

export const updateUser = (user: UserUpdatedEvent) => {
  saveEvents(user);
  updatedListeners.forEach(listener => listener(user));
}

export const deleteUser = (user: UserDeletedEvent) => {
  saveEvents(user);
  deletedListeners.forEach(listener => listener(user));
}
