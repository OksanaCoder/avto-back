const express = require("express");
const UserModel = require("./Schema");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const jwt = require("jsonwebtoken");

const _ = require("lodash");

const { authenticate, refreshToken } = require("../auth/authTools");
const { authorize, adminOnly } = require("../middlewares/authorize");
const { json } = require("express");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    // const {
    //   name,
    //   surname,
    //   username,
    //   phone,
    //   dob,
    //   email,
    //   password,
    //   //role,
    // } = req.body;
    const newUser = new UserModel(req.body);
    // const filepath = path.join(__dirname, `../../public/ADEDEJIMICHAEL.pdf`)
    // console.log(filepame)
    UserModel.findOne({ email }).exec((err, user) => {
      if (user) {
        return res.status(409).send("user with same email exists");
      }

      const token = jwt.sign({ newUser }, process.env.ACC_ACTIVATION_KEY, {
        expiresIn: "30m",
      });

      const data = {
        from: "avtoeinc@gmail.com",
        to: newUser.email,
        subject: "Account Activation Link",
        html: `<h2> Please click on given link to activate your account</h2>
        <p>This link expires in <strong>30 mins</strong> </p>
        <a href="${process.env.CLIENT_URL}/authentication/activate/${token}">Activate your account!</a>
        <p>${process.env.CLIENT_URL}/authentication/activate/${token}</>
        <small>Best regards,</small>
        <br>
        
        <strong>Kyviv, Ukraine</strong>
      `,
      };
      sgMail
        .send(data)
        .then(() => {
          console.log("Email sent");
          res.json({
            message: "Email has been sent kindly activate your account",
          });
        })
        .catch((error) => {
          console.error(error);
        });
      // mg.messages().send(data, function (error, body) {
      //   if (error) {
      //     return res.json({
      //       error: err.message,
      //     });
      //   }
      //   console.log(body);
      //   return res.json({
      //     message: "Email has been sent kindly activate your account",
      //   });
      // });
    });
  } catch (error) {
    res.send(error.errors);
  }
});
router.post("/email-activate", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (token) {
      jwt.verify(
        token,
        process.env.ACC_ACTIVATION_KEY,
        function (err, decodedToken) {
          if (err) {
            return res
              .status(400)
              .json({ error: "Incorrect or Expired link." });
          }

          try {
            const {
              name,
              surname,
              username,
              phone,
              dob,
              email,
              password,
              role,
            } = decodedToken;
            console.log(decodedToken);
            UserModel.findOne({ email }).exec((err, user) => {
              if (user) {
                return res.status(409).send("user with same email exists");
              }
              let newUser = new UserModel({
                name,
                surname,
                username,
                phone,
                dob,
                email,
                password,
                role,
              });
              newUser.save((err, success) => {
                if (err) {
                  console.log("Error in signup", err);
                  return res.status(400), json({ error: err });
                }
                const data = {
                  from: "noreply@betsoka.com.ng",
                  to: email,
                  subject: "Account Activated!",
                  html: `<h2> Congratulations, ${name} your account has been activated successfully</h2>
               
                <h4>You can now bet with you account!</h4>
                
                <small>Best regards,</small>
                <br>
                <strong>BetSoka INC</strong>
                <br>
                <strong>Lagos, Nigeria</strong>
                `,
                };
                // mg.messages().send(data, function (error, body) {
                //   if (error) {
                //     return res.json({
                //       error: err.message,
                //     });
                //   }
                //   return res.json({ message: "Account Activated!" });
                // });
                sgMail
                  .send(data)
                  .then(() => {
                    console.log("Email sent");
                    res.json({
                      message: "Account Activated",
                    });
                  })
                  .catch((error) => {
                    console.error(error);
                  });
              });
            });
          } catch (error) {
            res.send(error.error);
          }
        }
      );
    } else {
      return res.json({ error: "Invalid activation please check your email" });
    }
  } catch (error) {
    next(error);
  }
});
router.put("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;

    UserModel.findOne({ email }, (err, user) => {
      if (err || !user) {
        return res.status(409).send("user with same email exists");
      }
      const token = jwt.sign({ _id: user._id }, process.env.RESET_PASS_KEY, {
        expiresIn: "30m",
      });

      const data = {
        from: "noreply@betsoka.com.ng",
        to: email,
        subject: "PASSWORD ACTIVATION LINK",
        html: `<h2> Please click on given link to reset your password</h2>
        <a href="${process.env.CLIENT_URL}/forgot-password/${token}">Password reset link!</a>
        <p>${process.env.CLIENT_URL}/forgot-password/${token}</>
        <small>Best regards,</small>
        <br>
        <strong>BetSoka INC</strong>
        <br>
        <strong>Lagos, Nigeria</strong>
        `,
      };
      return user.updateOne({ resetLink: token }, function (err, success) {
        if (err) {
          return res.status(400).json({ error: "reset passord link error" });
        } else {
          sgMail
            .send(data)
            .then(() => {
              console.log("Email sent");
              res.json({
                message: "An email has been sent to you!",
              });
            })
            .catch((error) => {
              console.error(error);
            });
        }
      });
    });
  } catch (error) {
    next(error);
  }
});
router.put("/reset-password", async (req, res, next) => {
  try {
    const { resetLink, newPass } = req.body;
    if (resetLink) {
      jwt.verify(
        resetLink,
        process.env.RESET_PASS_KEY,
        function (error, decodedData) {
          if (error) {
            return res
              .status(401)
              .json({ error: "Incorrect token or it is expired." });
          }
          UserModel.findOne({ resetLink }, (err, user) => {
            if (err || !user) {
              return res
                .status(400)
                .json({ error: "user with this token does not exist" });
            }
            const obj = {
              password: newPass,
              resetLink: "",
            };

            user = _.extend(user, obj);

            user.save((err, result) => {
              if (err) {
                return res.status(400).json({ error: "reset passord error" });
              } else {
                return res
                  .status(200)
                  .json({ message: "Your password has been changed!" });
              }
            });
          });
        }
      );
    } else {
      return res.status(401).send("Authentication error!");
    }
  } catch (error) {
    next(error);
  }
});
router.get("/", authorize, adminOnly, async (req, res, next) => {
  try {
    const users = await UserModel.find(req.query);
    res.send({
      data: users,
      total: users.length,
    });
  } catch (error) {
    // console.log(error)
    next(error);
  }
});
router.get("/me", authorize, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (error) {
    next("While reading users list a problem occurred!");
  }
});

router.get("/:id", authorize, async (req, res, next) => {
  try {
    const users = await UserModel.findById(req.params.id);
    res.send(users);
  } catch (error) {
    // console.log(error)
    next(error);
  }
});

router.put("/:username", authorize, async (req, res, next) => {
  try {
    const updatedUser = await UserModel.findOneAndUpdate(req.params.username, {
      ...req.body,
    });

    if (updatedUser) res.send("user details updated ");
    res.send(`${req.params.name} not found`);
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await UserModel.findByCredentials(username, password);
    // console.log(user)
    const tokens = await authenticate(user);
    console.log("newly generated token : ", tokens);
    res.cookie("accessToken", tokens.token);
    res.cookie("refreshToken", tokens.refreshToken);
    // res.cookie("accessToken", tokens.token, {
    //   httpOnly: true,
    //   sameSite: "none",
    //   secure: true,
    // })
    // res.cookie("refreshToken", tokens.refreshToken, {
    //     httpOnly: true,
    //     sameSite: "none",
    //     secure: true,
    //     path: "/users/refreshToken",
    // })
    if (user) {
      res.send(user);
      res.send("login successfully");
    } else {
      res.status(404).json({ message: "User not found!" });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/logout", authorize, async (req, res, next) => {
  try {
    // req.user.refreshTokens = req.user.refreshTokens.filter(
    //   (t) => t.token !== req.body.refreshToken
    // )
    req.user.refreshTokens = [];
    await req.user.save();
    //res.clearCookie("accessToken");
    //res.clearCookie("refreshToken");
    res.send("logout successfully!");
  } catch (err) {
    next(err);
  }
});

router.post("/logoutAll", authorize, async (req, res, next) => {
  try {
    req.user.refreshTokens = [];
    await req.user.save();
    res.send("Logout successfully");
  } catch (err) {
    next(err);
  }
});

router.post("/refreshToken", async (req, res, next) => {
  const oldRefreshToken = req.body.refreshToken;
  if (!oldRefreshToken) {
    const err = new Error("Forbidden");
    err.httpStatusCode = 403;
    next(err);
  } else {
    try {
      const newTokens = await refreshToken(oldRefreshToken);
      res.send(newTokens);
    } catch (error) {
      // console.log(error)
      const err = new Error(error);
      err.httpStatusCode = 403;
      next(err);
    }
  }
});
// router.get("/:id/accounts", authorize, async (req, res, next) => {
//   try {

//     const user = await UserModel.findById(req.params.id).populate('account').exec();
//     res.status(200).send(user)

//   } catch (error) {
//     next(error);
//   }
// });
// router.get("/:id/accounts/:_id", authorize, async (req, res, next) => {
//   try {
//     const id = req.params.id;
//     const accountDetailsId = await AccountModel.findById(id);

//     if (accountDetailsId) {
//       res.status(200).send(accountDetailsId);
//     }
//     res.status(404).json({ message: `Account with ${id} is not Found` });
//   } catch (error) {
//     next(error);
//   }
// });

module.exports = router;
