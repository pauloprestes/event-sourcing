import config from "./config"
import { subscribeToNewEvents } from "./events/users"
import { lastAddedEvent, startCleanTables, handleEvents } from "./service"

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

export const program = async () => {
  if (config.replaying) {
    console.log("I'M ON REPLAYING MODE")
    await runUntilSucceed(startCleanTables)
  }
  else {
    console.log("I'M READY TO MAKE SOME REAL DEAL")
  }

  subscribeToNewEvents(lastAddedEvent, handleEvents)
}

program();
