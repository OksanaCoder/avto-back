const { model, Schema } = require("mongoose");


const auctionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },

    carId: {
      type: Schema.Types.ObjectId,
      ref: "car",
    },

    bidAmount: {
      type: Number,
      required: true,
    },  
  },

  {
    timestamps: true,
  }
);

auctionSchema.post("validate", function (error, doc, next) {
  if (error) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});

auctionSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});

auctionSchema.post("validate", function (error, doc, next) {
  if (error) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});
auctionSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});
// auctionSchema.static("bankAccount", async function(id){
//   const accounts = await UserModel.find({_id: id}).populate("bank_acounts");
//   return accounts;
// })

const AuctionModel = model("auction", auctionSchema);

module.exports = AuctionModel;
