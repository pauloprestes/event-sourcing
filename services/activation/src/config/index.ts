export default {
  replaying: process.env.REPLAY === "true",
  mongo_url: process.env.MONGO_URL || "mongodb://localhost:27017/testDB"
}
