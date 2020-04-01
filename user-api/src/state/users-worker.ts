import { Collection } from 'mongodb'
import { runConnected } from '../db';

const USER_TABLE = "local-worker";

interface UserRecord {
  _id: string
  email: string
  name: string
  createdAt: number
  lastUpdatedAt?: number
}

export const findUser = async (email: string) => runConnected(USER_TABLE, async (users: Collection<UserRecord>) => {
  const cursor = users.find({ email });
  if (!cursor.hasNext()) return null;

  return cursor.next();
});

export const listUsers = async () => runConnected(USER_TABLE, async (users: Collection<UserRecord>) =>
  users.find().toArray()
);
