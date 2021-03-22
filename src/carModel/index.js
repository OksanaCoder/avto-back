const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const { join } = require("path");
const multer = require("multer");
const q2m = require("query-to-mongo");

const carSchema = require("./Schema");
const carModel = require("./Schema");
const { authorize, adminOnly } = require("../middlewares/authorize");

const router = express.Router();
const upload = multer({});

const imagePath = path.join(__dirname, "../../public/images/cars");

const readFile = (fileName) => {
  const buffer = fs.readFileSync(path.join(__dirname, fileName));
  const fileContent = buffer.toString();
  return JSON.parse(fileContent);
};

router.post("/:id/upload", upload.single("car"), async (req, res, next) => {
  console.log(req.file.buffer);
  try {
    fs.writeFile(join(imagePath, `${req.params.id}.jpg`), req.file.buffer);

    req.body = {
      imageUrl: `${process.env.BACK_URL}/img/${req.params.id}.jpg`,
    };
    const car = await carModel.findByIdAndUpdate(req.params.id, req.body);
    console.log(car);
    if (car) {
      res.status(204).send(car);
    } else {
      const error = new Error(`user with id ${req.params.id} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const parsedQuery = q2m(req.query);
    const cars = await carSchema
      .find(parsedQuery.criteria, parsedQuery.options.fields)
      .populate("reviews")
      .sort(parsedQuery.options.sort)
      .limit(parsedQuery.options.limit)
      .skip(parsedQuery.options.skip);

    res.send({ cars, Total: cars.length });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const car = await carSchema.findById(id);

    if (car) {
      res.send(car);
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    error.httpStatusCode = 404;
    next("While reading cars from DB problem occured"); // next is sending the error to the error handler
  }
});

router.get("/:id/review", async (req, res, next) => {
  try {
    const car = await carModel.carReview(req.params.id);
    res.send(car);
  } catch (error) {
    error.httpStatusCode = 404;
    next("While reading cars review from DB problem occured"); // next is sending the error to the error handler
  }
});

router.post(
  "/image/:id",
  upload.array("cars"),
  authorize,
  adminOnly,
  async (req, res, next) => {
    try {
      console.log(req.files);
      const images = [];
      await Promise.all(
        req.files.map(async (e) => {
          const resolved = await fs.writeFile(
            path.join(
              __dirname,
              `${imagePath}/${req.params.id + e.originalname}`
            ),
            e.buffer
          );
          images.push(
            process.env.BACK_URL +
              "/images/cars" +
              req.params.id +
              e.originalname
          );
        })
      );
      await Promise.all(
        images.map(async (e) => {
          const post = await carModel.updateOne(
            {
              _id: req.params.id,
            },
            {
              $push: {
                images: e,
              },
            }
          );
        })
      );
      const added = await carModel.findById(req.params.id);
      res.send(added);
    } catch (err) {
      next(err);
    }
  }
);

router.post("/", authorize, adminOnly, async (req, res, next) => {
  try {
    const newCar = new carSchema(req.body);
    const { _id } = await newCar.save();
    res.status(201).json({ "new car added": _id });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authorize, adminOnly, async (req, res) => {
  const car = await carSchema.findByIdAndUpdate(req.params.id, req.body);
  if (car) {
    res.status(204).send(car);
  } else {
    const error = new Error(`user with id ${req.params.id} not found`);
    error.httpStatusCode = 404;
    next(error);
  }
});

router.delete("/:id", authorize, adminOnly, async (req, res) => {
  const car = await carSchema.findByIdAndDelete(req.params.id);
  if (car) {
    res.send(`Deleted car with id: ${req.params.id}`);
  } else {
    const error = new Error(`car with id ${req.params.id} not found`);
    error.httpStatusCode = 404;
    next(error);
  }
});

module.exports = router;
