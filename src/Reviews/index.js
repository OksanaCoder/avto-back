const express = require("express")
const fs = require("fs-extra")
const path = require ("path")
const ReviewSchema =require("./schema")
const router = express.Router()


router.get("/" , async (req,res,next) => {
    const reviews = await ReviewSchema.find(req.query);
    res.send(reviews);
})

router.get("/:id" , async (req,res,next) => {
    try {
        const id = req.params.id
        const review = await ReviewSchema.findById(id);
        if (review) {
          res.send(review)
        } else {
          const error = new Error()
          error.httpStatusCode = 404
          next(error)
        }
      } catch (error) {
        console.log(error)
        next("While reading users list a problem occurred!")
      }
})

router.post("/" , async(req,res,next) => {
    try {
        const newReview = new ReviewSchema(req.body)
        const {_id} = await newReview.save();
        
        res.status(201).send("New review created with id: "+ _id)
    } catch (error) {
        next(error)
    }
})

router.put("/:id" , async(req,res,next) => {
    const editReview = await ReviewSchema.findByIdAndUpdate(req.params.id, req.body);
    
    if(editReview){
        res.status(204).send(`Review with id: ${req.params.id} Updated`)
    }else{
        const error = new Error(`Review  with id ${req.params.id} not found`)
        error.httpStatusCode = 404;
        next(error);
        
    }
    
   
})
router.delete("/:id" , async(req,res,next) => {
    const deleteReview = await ReviewSchema.findByIdAndDelete(req.params.id);
    
    if(deleteReview){
        res.status(202).send(`Review with id: ${req.params.id} Deleted!`);
    }else{
        const error = new Error(`Review  with id ${req.params.id} not found`);
        error.httpStatusCode = 404;
        next(error);
        
    }
})
module.exports = router;