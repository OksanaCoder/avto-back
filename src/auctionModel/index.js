const express = require("express");
const AuctionModel = require("./Schema");

const auctionRoute = express.Router();

auctionRoute.get("/", async (req, res, next) => {});

auctionRoute.get("/:id", async (req, res, next) => {});
auctionRoute.post("/", async (req, res, next) => {});
auctionRoute.put("/:id", async (req, res, next) => {});

auctionRoute.delete("/:id", async (req, res, next) => {});

module.exports = auctionRoute;
