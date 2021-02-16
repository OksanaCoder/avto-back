const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
dotenv.config()
const db = require("./db")

const listEndpoints = require("express-list-endpoints")
const path = require("path")

const server = express()
server.use(cors())

server.use(express.static(path.join(__dirname, `../public`)))


console.log(listEndpoints(server))
server.listen(process.env.PORT || 3456, () => console.log("Running on ", process.env.PORT || 3456))