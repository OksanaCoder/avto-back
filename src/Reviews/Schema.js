const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const valid = require("validator");

var x = Date.now;
const ReviewSchema = new Schema(
  {
    comment: {
      type: String,
      required: true,
    },
    rate: {
      type: Number,
      min: [1, "Sorry you can't rate below 1!"],
      max: [5, "MAximum rating is 5"],

      validate(value) {
        if (value < 0) {
          throw new Error("rate must be a positive number!");
        }
      },
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.pre("save", function (next) {
  this.createdAt = Date.now();
  next();
});

const reviewModel = mongoose.model("reviews", ReviewSchema);
module.exports = reviewModel;
