require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
};

start();

// Safety nets: log and exit cleanly on unhandled issues instead of a silent crash
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});
