import express from "express";
import Logger from "./Middlewares/Logger.js";
import ErrorHandler from "./Middlewares/ErrorHandler.js";
import Router from "./Router/Routes.js";
const app = express();

// Register App level middleware
app.use(express.json());
app.use(ErrorHandler); // Error handler
app.use(Logger); // Logger
app.use(express.static("public"));

app.use("/pdf", Router);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Server started at Port ${PORT}.`);
});
