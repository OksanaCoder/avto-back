const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
dotenv.config()
const db = require("./db")
const userRouter = require("./userModel/index");
const cookieParser = require("cookie-parser");
const listEndpoints = require("express-list-endpoints")
const path = require("path")

const server = express()
server.use(cors())
server.use(express.json());
server.use(cookieParser());
server.use(express.static(path.join(__dirname, `../public`)))
server.use("/users", userRouter);
server.use("/cars", require("./carModel/index"));
console.log(listEndpoints(server))
server.listen(process.env.PORT || 3456, () => console.log("Running on ", process.env.PORT || 3456))