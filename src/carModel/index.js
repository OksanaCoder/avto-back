const express = require("express")
const db = require("../db")
const { authorize, onlyForAdmin } = require("../middlewares/authorize")
const router = express.Router()
const fs = require("fs-extra")
const path = require("path")
const multer = require("multer")
const upload = multer()
const port = process.env.PORT
const imagePath = path.join(__dirname, "../../../public/img/products")
console.log(imagePath)

router.post("/:id/upload", upload.single("product"), async (req, res, next) => {
    try {
      await fs.writeFile(path.join(imagePath, `${req.params.id}.png`), req.file.buffer)
      req.body = {
        imageurl: `http://127.0.0.1:${port}/img/cars/${req.params.id}.png`
      }
      let params = []
      let query = 'UPDATE "cars" SET '
      for (bodyParamName in req.body) {
          query += // for each element in the body I'll add something like parameterName = $Position
              (params.length > 0 ? ", " : '') + //I'll add a coma before the parameterName for every parameter but the first
              bodyParamName + " = $" + (params.length + 1) // += Category = $1 
          params.push(req.body[bodyParamName]) //save the current body parameter into the params array
      }
      params.push(req.params.id) //push the id into the array
      query += " WHERE _id = $" + (params.length) + " RETURNING *" 
      console.log(query)
      const result = await db.query(query, params) //querying the DB for updating the row
      if (result.rowCount === 0) //if no element match the specified id => 404
          return res.status(404).send("Not Found")
      res.send(result.rows[0]) //else, return the updated version
    } catch (error) {
      next(error)
    }
  })


router.get("/", async(req, res)=>{
   // const order = req.query.order || "asc"
    const offset = req.query.offset || 0
    const limit = req.query.limit
    
    //delete req.query.order
    delete req.query.offset
    delete req.query.limit
    
    let query = 'SELECT * FROM "products"'
    const params=[]
    for (const queryParam in req.query) {
        params.push(req.query[queryParam])
        if (params.length === 1) 
            query += `WHERE ${queryParam} = $${params.length} `
        else 
            query += ` AND ${queryParam} = $${params.length} `
    }
    
    //query += " ORDER BY brand " + order; 

    params.push (limit)
    query += ` LIMIT $${params.length} `
    params.push(offset)
    query += ` OFFSET $${params.length}`
    
    
    const response = await db.query(query, params)
    res.send({count: response.rows.length, products: response.rows})

})

router.get("/search/:query", async(req, res) => {
    const response = await db.query(`SELECT * FROM "products" WHERE 
                                    brand ILIKE '${"%" + req.params.query + "%"}' OR
                                    category ILIKE '${"%" + req.params.query + "%"}'
                                    LIMIT $1 OFFSET $2 
                                    `, [ req.query.limit || 10, req.query.offset || 0])

    res.send(response.rows)
})
router.get("/:id", async (req, res)=>{
    const response = await db.query('SELECT * FROM "products" WHERE _id= $1', 
                                                                                        [ req.params.id ])

    if (response.rowCount === 0) 
        return res.status(404).send("Not found")

    res.send(response.rows[0])
})

router.get("/:id/reviews", async (req, res)=>{
    const response = await db.query(`SELECT  * FROM "reviews" 
                                    JOIN "products" ON reviews.productid= products._id 
                                    AND products._id = $1`, 
                                    [req.params.id])
    if (response.rowCount === 0) 
        return res.status(404).send("Not found")

    res.send(response.rows)
})

router.post("/", authorize, onlyForAdmin, async (req, res)=> {
    const response = await db.query(`INSERT INTO "products" ( make, model,year, price,fuel,odometer,transmission,drive,color,contact,location description) 
                                     Values ($1, $2, $3, $4, $5,$6,$7, $8, $9, $10, $11,$12)
                                     RETURNING *`, 
                                    [ req.body.make, req.body.model, req.body.year, req.body.price, req.body.fuel, req.body.odometer, req.body.transmission, req.body.drive, req.body.color, req.body.contact, req.body.location ])
    
    console.log(response)
    res.send(response.rows[0])
})

router.put("/:id",authorize, onlyForAdmin, async (req, res)=> {
    try {
        let params = []
        let query = 'UPDATE "products" SET '
        for (bodyParamName in req.body) {
            query +=
                (params.length > 0 ? ", " : '') +
                bodyParamName + " = $" + (params.length + 1) 

            params.push(req.body[bodyParamName])
        }

        params.push(req.params.id) //push the asin into the array
        query += " WHERE _id = $" + (params.length) + " RETURNING *" 
        console.log(query)

        const result = await db.query(query, params) //querying the DB for updating the row

       
        if (result.rowCount === 0) //if no element match the specified ASIN => 404
            return res.status(404).send("Not Found")

        res.send(result.rows[0]) //else, return the updated version
    }
    catch(ex) {
        console.log(ex)
        res.status(500).send(ex)
    }
})

router.delete("/:id",authorize, onlyForAdmin, async (req, res) => {
    const response = await db.query(`DELETE FROM "products" WHERE _id= $1`, [ req.params.id ])

    if (response.rowCount === 0)
        return res.status(404).send("Not Found")
    
    res.send("OK")
})

module.exports = router