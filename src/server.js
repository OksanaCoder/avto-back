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
const whitelist = ["http://localhost:3000", "http://localhost:3001"];
// const corsOptions = {
//   origin: (origin, callback) => {
//     if (whitelist.indexOf(origin) !== -1 || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// };

server.use(cors())
server.use(express.json());
server.use(cookieParser());
server.use(express.static(path.join(__dirname, `../public`)))
server.use("/users", userRouter);
server.use("/cars", require("./carModel/index"));
console.log(listEndpoints(server))
server.listen(process.env.PORT || 3456, () => console.log("Running on ", process.env.PORT || 3456))