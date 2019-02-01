const mongoose = require("mongoose");

const bruteForceSchema = new mongoose.Schema(
  {
    _id: { type: String },
    data: {
      count: Number,
      lastRequest: Date,
      firstRequest: Date
    },
    expires: { type: Date, index: { expires: "1d" } }
  },
  { collection: "bruteforce" }
);

module.exports = bruteForceSchema;
