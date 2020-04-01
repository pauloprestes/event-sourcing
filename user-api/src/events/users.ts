import { save } from "../db/db";

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
