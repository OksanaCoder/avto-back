const jwt = require("jsonwebtoken");
const UserModel = require("../userModel/Schema");
const { verifyJWT } = require("../auth/authTools");

const authorize = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    const decoded = await verifyJWT(token);
    const user = await UserModel.findOne({
      _id: decoded._id,
    });
    console.log("I am the user",user);

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    //console.log(e)
    const err = new Error("Please authenticate");
    err.httpStatusCode = 401;
    next(err);
  }
};

const adminOnlyMiddleware = async (req, res, next) => {
  if (req.user && req.user.role === "admin") next();
  else {
    const err = new Error("Only for admins!");
    err.httpStatusCode = 403;
    next(err);
  }
};

module.exports = {
  authorize,
  adminOnlyMiddleware,
};
