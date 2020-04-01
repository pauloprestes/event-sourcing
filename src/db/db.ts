
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

export const save = async (event: { id: string, type: string }) => {
  const events = await connectToDB()
  events.insertOne({ ...event, addedAt: Date.now() }, function (err) {
    if (err) throw err;
  });
}

interface DefaultEvent {
  addedAt: number
  id: string
  type: string
};

type EventNotification = (event: DefaultEvent[]) => Promise<void>;

let lastAdded: number = null


const lastAddedEvent = (events: DefaultEvent[]): number => events.reduce((previous, current) => {
  if (!previous.addedAt) return current
  if (previous.addedAt < current.addedAt) return current
  return previous
}, { addedAt: null }).addedAt;


const queryBasedOnLastAddedDate = () => {
  if (!lastAdded) return {};
  return { addedAt: { $exists: true, $gt: lastAdded } };
}

export const listNewEvents = (notify: EventNotification) => {
  const backgroundQuery = async () => {
    setTimeout(async () => {
      try {
        const events = await connectToDB();
        const query = queryBasedOnLastAddedDate()
        const result = await events.find(query).toArray()
        if (result.length > 0) {
          lastAdded = lastAddedEvent(result)
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

export const listAll = async (): Promise<DefaultEvent[]> => {
  const events = await connectToDB()
  const data = await events.find().toArray()

  lastAdded = lastAddedEvent(data)
  return data;
}

export const listNewEventsPerId = async ({ id, lastAdded }: { id: string, lastAdded: number }) => {
  const events = await connectToDB();
  const query = { id, addedAt: { $exists: true, $gt: lastAdded } }
  return await events.find(query).toArray();
}
