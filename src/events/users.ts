import { cloneDeep } from "lodash";

const allEvents = []
const allListeners = []

export interface UserCreatedEvent {
  id: string
  email: string
  name: string
}

export interface UserUpdatedEvent {
  id: string
  name: string
}

type Events = UserCreatedEvent | UserUpdatedEvent;

const deliveryEvents = (user: Events) => {
  allListeners.forEach(listener => listener(user));
}


const saveEvents = (userEvent: Events) => allEvents.push(cloneDeep(userEvent));

export const addListener = (listener: (anEvent: Events) => void) => {
  allListeners.push(listener);
}

export const addUser = (user: UserCreatedEvent) => {
  saveEvents(user);
  deliveryEvents(user);
}

export const updateUser = (user: UserUpdatedEvent) => {
  saveEvents(user);
  deliveryEvents(user);
}
