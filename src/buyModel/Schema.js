const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const valid = require("validator");

const buySchema = new Schema(
  {
    carId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "cars",
      },
    ],
    userId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
  },
  { timestamps: true }
);

buySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

buySchema.post("validate", function (error, doc, next) {
  if (error) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});

buySchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});

const buyModel = mongoose.model("car", buySchema);
module.exports = buyModel;
