import { deleteOldState, applyEventsToState } from "./state";
import { listNewEvents } from "./events";

export const backgroundUpdate = async () => {
  await deleteOldState();
  listNewEvents(async events => {
    await applyEventsToState(events)
  })
}

backgroundUpdate();
