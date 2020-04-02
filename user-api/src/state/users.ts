import * as noWorker from './users-no-worker'
import * as withWorker from './users-worker'
import { subscribeToNewEvents } from '../events/users';


const lastAddedEvent = (events: { addedAt: number }[]): number => events.reduce((previous, current) => {
  if (!previous.addedAt) return current
  if (previous.addedAt < current.addedAt) return current
  return previous
}, { addedAt: 0 }).addedAt;

const program = async () => {
  runUntilSucceed(noWorker.startCleanTables);
  let lastAdded: number = 0
  subscribeToNewEvents(async () => lastAdded, async (events) => {
    await noWorker.applyEventsToState(events)
    lastAdded = lastAddedEvent(events)
  })
}

const runUntilSucceed = <T>(execute: () => T) => new Promise(resolve => {
  setTimeout(async () => {
    try {
      await execute()
      resolve()
    } catch (err) {
      console.log("Failed: ")
      console.log(err)
    }
  }, 100)
})


const selectUserImplementation = () => {
  if (process.env.WORKER !== "true") {
    console.log("DON'T WORRY, I'M HANDLING SYNCHRONIZATION")
    program()
    return noWorker
  }

  console.log("NEEDS WORKER TO SYNCHRONIZE")
  return withWorker
}

const defaultUser = selectUserImplementation()
export const findUser = defaultUser.findUser
export const listUsers = defaultUser.listUsers
