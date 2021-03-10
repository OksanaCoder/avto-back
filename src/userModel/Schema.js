const { model, Schema } = require("mongoose");
const validator = require("mongoose-validator");
const bcrypt = require("bcrypt")

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    
    username: {
      type: String,
      lowercase: true,
      required: true,
      trim: true,
      unique: true,
    },
 
    email: {
        type: String,
        lowercase: true,
        trim: true,
        validate: [
          validator({
            validator: "isEmail",
            message: "Oops..please enter valid email",
          }),
        ],
        required: true,
      },
    password: {
      type: String,
      required: true,
      minlength: 7,
    },
    phone: {
        type: String,
        validate: {
          validator: function (v) {
            return /0\d{1}\d{4}\d{4}/.test(v);
          },
          message: "Phone number is not valid, allows only 11 digits",
        },
        required: [true, "User phone number required"],
      },
    role: {
      type: String,
      required: true,
      trim: true,
      default: "user",
    },
  
    resetLink: {
      data: String,
      default: "",
    },
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    cars: [{
      type: Schema.Types.ObjectId,
      ref: "cars",
    }],
    reviews: [{
      type: Schema.Types.ObjectId,
      ref: "review",
    }],
  },

  {
    timestamps: true,
  }
);


userSchema.post("validate", function (error, doc, next) {
  if (error) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});

userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.__v;

  return userObject;
};
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await UserModel.findOne({
    email
  });
  console.log("Whats going on here",user);
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const err = new Error("Unable to login");
    err.httpStatusCode = 401;
    throw err;
  }
  console.log("I am right here");

  return user;
};
userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

userSchema.post("validate", function (error, doc, next) {
  if (error) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});
userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});
// userSchema.static("bankAccount", async function(id){
//   const accounts = await UserModel.find({_id: id}).populate("bank_acounts");
//   return accounts;
// })  

const UserModel = model("user", userSchema);

module.exports = UserModel;
