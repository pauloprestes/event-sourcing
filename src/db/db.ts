
import { MongoClient } from 'mongodb'
import { resolve } from 'dns';

var url = "mongodb://localhost:27017/";

export const save = (event: { id: string, type: string }) => {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("testDB");
    dbo.collection("events").insertOne(event, function (err, res) {
      if (err) throw err;
      console.log("1 document inserted");
      db.close();
    });
  });
}

export const list = (id: string): Promise<{ id: string }[]> => {
  return new Promise((resolve) => {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("testDB");
      dbo.collection("events").find({ id }).toArray((err, result) => {
        if (err) throw err;
        resolve(result);
        db.close();
      });
    });
  });
};

export const listAll = (): Promise<{ id: string, type: string }[]> => {
  return new Promise((resolve) => {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("testDB");
      dbo.collection("events").find().toArray((err, result) => {
        if (err) throw err;
        resolve(result);
        db.close();
      });
    });
  });
};
