const express = require("express")
const db = require("../db")
const bcrypt = require("bcrypt")
const { authenticate, refreshToken } = require("../auth/authTools")
const { authorize, onlyForAdmin } = require("../middlewares/authorize")

const userRouter = express.Router();


userRouter.get("/", authorize,onlyForAdmin, async (req, res, next) => {
    try {
        const sort = req.query.sort
        const order = req.query.order
        const offset = req.query.offset || 0
        const limit = req.query.limit

        delete req.query.sort
        delete req.query.order
        delete req.query.offset
        delete req.query.limit

        let query = 'SELECT * FROM "users" ' //create query

        const params = []
        for (queryParam in req.query) { //for each value in query string, I'll filter
            params.push(req.query[queryParam])

            if (params.length === 1)
                query += `WHERE ${queryParam} = $${params.length} `
            else
                query += ` AND ${queryParam} = $${params.length} `
        }

        if (sort !== undefined)
            query += `ORDER BY ${sort} ${order}`  //adding the sorting 

        params.push(limit)
        query += ` LIMIT $${params.length} `
        params.push(offset)
        query += ` OFFSET $${params.length}`
        console.log(query)

        const response = await db.query(query, params)

        res.send({ count: response.rows.length, data: response.rows })

    } catch (error) {
        next(error)
    }
})

userRouter.get("/me", authorize, async (req, res, next) => {
    try {
        res.send(req.user)
        


    } catch (error) {
        next(error)
    }
})
userRouter.post("/register-admin",  async (req, res, next) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 12)


        const newUser = await db.query(`INSERT INTO "users" (firstname, lastname,username,email, password, dob, phone, role) 
            Values ($1, $2, $3,$4, $5, $6,$7, $8)
            RETURNING *`,
            [req.body.firstname,req.body.lastname, req.body.username, req.body.email,
              hashedPassword,req.body.dob, req.body.phone, req.body.role])

      

        res.status(201).send(newUser.rows[0])
    } catch (error) {
        next(error)
    }
})

userRouter.post("/register",  async (req, res, next) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)


        const newUser = await db.query(`INSERT INTO "users" (firstname, lastname,username,email, password, dob, phone) 
            Values ($1, $2, $3,$4, $5, $6,$7)
            RETURNING *`,
            [req.body.firstname,req.body.lastname, req.body.username, req.body.email,
              hashedPassword,req.body.dob, req.body.phone])
            if(newUser){
                res.status(201).send(newUser.rows[0])
            }else{
                res.status(404).json({message: "Error registering new user"})
            }
      

        
    } catch (error) {
        next(error)
    }
})

// EXTRA) Using multer middleware to upload image
// const getFileName = (file) => file.originalname

// const multerOptions = multer({
//     storage: new MulterAzureStorage({
//         azureStorageConnectionString: process.env.STORAGE_CS,
//         containerName: 'images',
//         containerSecurity: 'container',
//         fileName: getFileName
//     })
// })

userRouter.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body

        const getUser = await db.query('SELECT * FROM "users" WHERE email= $1',
            [email])

        const isMatch = await bcrypt.compare(password, getUser.rows[0].password)
        if (!isMatch) {
            const err = new Error("Unable to login")
            err.httpStatusCode = 401
            throw err
        }

        const user = getUser.rows[0]

        const tokens = await authenticate(user);
        // res.cookie("accessToken", tokens.accessToken);
        // res.cookie("refreshToken", tokens.refreshToken);
        res.cookie("accessToken", tokens.accessToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            path: "/users/refreshToken",
        });
        // res.send(tokens)
        // res.send({ title: user.title, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
        res.send(user)

    } catch (error) {
        next(error)
    }
})

userRouter.post("/logout", authorize, async (req, res, next) => {
    try {
        let params = []
        let query = `UPDATE "users" SET refreshToken = null`

        params.push(req.user._id)
        query += " WHERE _id = $" + (params.length) + " RETURNING *"
        console.log(query)

        const result = await db.query(query, params)

        if (result.rowCount === 0)
            return res.status(404).send("Not Found")

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        res.send("logout successful!")

    } catch (err) {
        next(err)
    }
})

userRouter.post("/refreshToken", async (req, res, next) => {
    const oldRefreshToken = req.cookies.refreshToken
    if (!oldRefreshToken) {
        const err = new Error("Forbidden")
        err.httpStatusCode = 403
        next(err)
    } else {
        try {
            const newTokens = await refreshToken(oldRefreshToken)
            res.cookie("accessToken", newTokens.accessToken, {
                httpOnly: true,
                sameSite: "none",
                secure: true,
            })
            res.cookie("refreshToken", newTokens.refreshToken, {
                httpOnly: true,
                sameSite: "none",
                secure: true,
                path: "/users/refreshToken",
            })
            res.send("newTokens sent!")
        } catch (error) {
            console.log(error)
            const err = new Error(error)
            err.httpStatusCode = 403
            next(err)
        }
    }
})

module.exports = userRouter

