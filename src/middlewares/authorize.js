const jwt = require("jsonwebtoken");
const { verifyJWT } = require("../auth/authTools")
const db = require("../db")

const authorize = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken
   
    console.log("........................",token)
    const decoded = await verifyJWT(token)
    const user = await db.query('SELECT * FROM "users" WHERE _id= $1',
      [decoded._id])

    if (!user) {
      throw new Error()
    }

    req.token = token
    req.user = user.rows[0]

    if (req.user.refreshToken === null) {
      const err = new Error("Sorry you already logged out!")
      err.httpStatusCode = 403
      next(err)
    }
    next()
  } catch (e) {
    const err = new Error("Please authenticate")
    err.httpStatusCode = 401
    next(err)
  }
}

const onlyForAdmin = async (req, res, next) => {
  if (req.user && req.user.role === "admin") next()
  else {
    const err = new Error("Only for admin!")
    err.httpStatusCode = 403
    next(err)
  }
}



module.exports = { authorize, onlyForAdmin}