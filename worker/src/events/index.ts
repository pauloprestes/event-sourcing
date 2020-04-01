import { MongoClient, Collection } from 'mongodb'
import config from '../config';

const connectToDB = async (): Promise<Collection<DefaultEvent>> => {
  const db = await MongoClient.connect(config.mongo_url, {
    poolSize: 10,
    // retry to connect for 60 times
    reconnectTries: 60,
    // wait 1 second before retrying
    reconnectInterval: 1000
  })
  return db.db("testDB").collection("events");
}

interface DefaultEvent {
  addedAt: number
  id: string
  type: string
};

type EventNotification = (event: DefaultEvent[]) => Promise<void>;


const queryBasedOnLastAddedDate = (lastAdded: number) => {
  if (!lastAdded) return {};
  return { addedAt: { $exists: true, $gt: lastAdded } };
}

export const subscribeToNewEvents = (cursor: () => number, notify: EventNotification) => {
  const backgroundQuery = async () => {
    setTimeout(async () => {
      try {
        const events = await connectToDB();
        const query = queryBasedOnLastAddedDate(cursor())
        const result = await events.find(query).toArray()
        if (result.length > 0) {
          await notify(result)
        }
      }
      catch (err) {
        console.log("error listing new events")
      }
      finally {
        backgroundQuery()
      }
    }, 100);
  }
  backgroundQuery()
}
