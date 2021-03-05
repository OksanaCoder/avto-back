const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const valid = require("validator");

const carSchema = new Schema(
  {
    make: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },

    year: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      validate(value) {
        if (value < 0) {
          throw new Error("price must be a positive number");
        }
      },
    },
    fuel: {
      type: String,
      required: true,
    },
    odometer: {
      type: Number,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    transmission: {
      type: String,
      required: true,
    },
    drive: {
      type: String,
      required: true,
    },
    color:{
        type:String,
        required: true
    },
    location:{
        
    },
    description:{
        type: String,
        required: true
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "reviews",
      },
    ],
  },
  { timestamps: true }
);

carSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
carSchema.static("carReview", async function (carId) {
  const product = await carModel
    .findOne({ _id: carId })
    .populate("reviews");
  return product;
});

carSchema.post("validate", function (error, doc, next) {
  if (error) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});

carSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});

const carModel = mongoose.model("car", carSchema);
module.exports = carModel;
