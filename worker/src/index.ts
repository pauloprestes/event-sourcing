import { deleteOldState, applyEventsToState } from "./state";
import { subscribeToNewEvents } from "./events";

const lastAddedEvent = (events: { addedAt: number }[]): number => events.reduce((previous, current) => {
  if (!previous.addedAt) return current
  if (previous.addedAt < current.addedAt) return current
  return previous
}, { addedAt: null }).addedAt;


export const program = async () => {
  await deleteOldState();
  let lastAdded: number = null
  subscribeToNewEvents(() => lastAdded, async (events) => {
    await applyEventsToState(events)
    lastAdded = lastAddedEvent(events)
  })
}

program();
