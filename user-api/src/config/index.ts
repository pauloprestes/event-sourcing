export default {
  deleteEvents: process.env.DELETE_EVENTS === "true",
  port: process.env.PORT || 8001,
  mongo_url: process.env.MONGO_URL || "mongodb://localhost:27017/testDB"
}
