const mongoose = require("mongoose");

mongoose.connect(
  process.env.URI,
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  (error, client) => {
    if (error) {
      return console.log("Facing some issue Connecting to DB");
    }
    console.log("DB Connected Successfully");
  }
);
