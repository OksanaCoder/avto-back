const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const valid = require("validator");
const geocoder = require("../Utils/geoCoder")
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
    images: {
      type: Array,
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
    location: {
      type: {
        type: String,
        enum: ["Point"],

      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
      formattedAddress: String,
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

carSchema.pre('save', async function (next) {
  const loc = await geocoder.geocode(this.address)
  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[1].latitude],
    formattedAddress: loc[0].formattedAddress
  }
  this.address = undefined
  next()
  console.log(loc)
})

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
