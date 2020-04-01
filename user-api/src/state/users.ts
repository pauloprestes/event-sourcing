import * as noWorker from './users-no-worker'
import * as withWorker from './users-worker'
import { subscribeToNewEvents } from '../events/users';


const selectUserImplementation = () => {
  if (process.env.WORKER !== "true") {
    console.log("DON'T WORRY, I'M HANDLING SYNCHRONIZATION")
    const lastAddedEvent = (events: { addedAt: number }[]): number => events.reduce((previous, current) => {
      if (!previous.addedAt) return current
      if (previous.addedAt < current.addedAt) return current
      return previous
    }, { addedAt: null }).addedAt;

    const program = async () => {
      await noWorker.deleteOldState();
      let lastAdded: number = null
      subscribeToNewEvents(() => lastAdded, async (events) => {
        await noWorker.applyEventsToState(events)
        lastAdded = lastAddedEvent(events)
      })
    }

    program()
    return noWorker
  }
  console.log("NEEDS WORKER TO SYNCHRONIZE")
  return withWorker
}

const defaultUser = selectUserImplementation()
export const findUser = defaultUser.findUser
export const listUsers = defaultUser.listUsers
