const mongoose = require("mongoose");

const donateSchema = new mongoose.Schema({
  amount: {
    type: Number,
  },
  doneatorId: {
    type: String,
  },
  backeryId: {
    type: String,
  },
  confirmation: {
    type: String,
    default: "Waiting for confirmation",
  },
  donatorsname: {
    type: String,
  },
  date: {
    type: String,
  },
  confirmedAmount: {
    type: Number,
    default: 0,
  },
  newConfirmedAmount: {
    type: Number,
    
  }
});

const Donate = mongoose.model("Donation", donateSchema);

module.exports = Donate;
