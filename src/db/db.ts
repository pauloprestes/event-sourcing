
import { MongoClient } from 'mongodb'

var url = "mongodb://localhost:27017/testDB";

const connectToDB = async (): Promise<any> => new Promise(resolve => MongoClient.connect(url, { poolSize: 10 }, function (err, db) {
  if (err) throw err;
  resolve(db.db("testDB").collection("events"));
  //db.close();
}))

export const save = async (event: { id: string, type: string }) => {
  const events = await connectToDB()
  events.insertOne({ ...event, addedAt: Date.now() }, function (err) {
    if (err) throw err;
  });
}

type DefaultEvent = {
  id: string;
  type: string;
};

type EventNotification = (event: DefaultEvent[]) => void;

let lastAdded = null

export const listNewEvents = (notify: EventNotification) => {
  const backgroundQuery = async () => {
    setTimeout(async () => {
      const events = await connectToDB();
      const query = { addedAt: { $exists: true, $gte: lastAdded } }
      events.find(query).toArray((_, result) => {
        notify(result)
      })
      backgroundQuery()
    }, 50);
  }
  backgroundQuery()
}

export const listAll = async (): Promise<DefaultEvent[]> => {
  const events = await connectToDB()
  return new Promise(resolve => {
    events.find().toArray((err, result) => {
      if (err) throw err;

      lastAdded = result.reduce((previous, current) => {
        if (!previous || !previous.addedAt) return current
        if (previous.addedAt < current.addedAt) return current
        return previous
      }).addedAt;
      resolve(result);
    });
  })
}
