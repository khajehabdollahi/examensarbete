if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const session = require("express-session");
const path = require("path");
const mongoose = require("mongoose");

const nodemailer = require("nodemailer");
const mailer = require("./views/mailer");
const mailerForget = require("./views/mailerForget");

const Donate = require("./models/Donation");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");

const User = require("./models/User");
const Newbackery = require("./models/Backery");

const MongoStore = require("connect-mongo");

const multer = require("multer");

const uuid = require("uuid");

const { storage } = require("./cloudinary/index");
const console = require("console");

const upload = multer({ storage });

const dbUrl = "mongodb://localhost:27017/backery";

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: "squirrel",
  },
});

store.on("error", function (e) {
  console.log("Error to save to dataBase", e);
});

const sessionConfig = {
  store,
  secret: "thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
// app.use(express.static(__dirname + "/public"));
app.use("/public", express.static("public"));

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

const requiredLogin = (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  next();
};

app.get("/secret", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  res.render("secret");
});

app.get("/newones", requiredLogin, (req, res) => {
  res.render("newone");
});

app.post("/newb", upload.single("image"), async (req, res) => {
  const input = req.body;
  const b = new Newbackery(input);
  b.city = req.body.city.toLowerCase();
  b.provience = req.body.provience.toLowerCase();
  b.district = req.body.district.toLowerCase();
  b.Street = req.body.Street.toLowerCase();
  b.line = req.body.line.toLowerCase();
  b.image = req.file.path;
  b.creator.username = req.user.username;
  b.creator.name = req.user.name;
  b.creator.id = req.user.id;

  await b.save();
  res.redirect("/");
});
app.post("/newb", upload.single("image"), async (req, res) => {
  const input = req.body;
  const b = new Newbackery(input);
  b.city = req.body.city.toLowerCase();
  b.provience = req.body.provience.toLowerCase();
  b.district = req.body.district.toLowerCase();
  b.Street = req.body.Street.toLowerCase();
  b.line = req.body.line.toLowerCase();
  b.image = req.file.path;
  b.creator.username = req.user.username;
  b.creator.name = req.user.name;
  b.creator.id = req.user.id;

  await b.save();
  res.redirect("/");
});

app.put("/newb/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const backery = await Newbackery.findByIdAndUpdate(id, data);
  backery.image = req.file.path;
  backery.save();
  res.redirect("/backeries");
});

app.get("/newb/:id", async (req, res) => {
  const { id } = req.params;
  const backery = await Newbackery.findById(id).populate("creatorbyId");
  const donations = await Donate.find({ backeryId: id });
  res.render("backeryDetail", { backery, donations });
});

app.get("/newb/:id/edit", requiredLogin, async (req, res) => {
  const { id } = req.params;
  const backery = await Newbackery.findById(id);
  res.render("edit", { backery });
});

app.delete("/newb/:id", async (req, res) => {
  const { id } = req.params;
  await Newbackery.findByIdAndDelete(id);
  //  req.flash("mes", "Yes deleted a backery");
  res.redirect("/");
});

app.get("/deleteconfirm/:id", async (req, res) => {
  const { id } = req.params;
  const backery = await Newbackery.findById(id);
  res.render("backeryDelete", { id, backery });
});

app.get("/new", (req, res) => {
  req.session.returnTo = req.originalUrl;
  res.render("newbackery");
});

app.get("/backeries", async (req, res) => {
  const backeries = await Newbackery.find({});

  res.render("backeries", { backeries });
});

app.get("/backeryimagedelete/:id", async (req, res) => {
  const { id } = req.params;
  const backery = await Newbackery.findById(id);
  backery.image = req.file.path;
  try {
    await cloudinary.v2.uploader.destroy(
      image,
      { invalidate: true, resource_type: "path" },
      async (error, result) => {
        if (error) {
          return res.status(400).json(error);
        }
        await Property.updateOne({ $pull: { pictures: img } });
        res.json(result);
      }
    );
  } catch (e) {
    res.status(500).json("Something went wrong");
  }
});

app.get("/", (req, res) => {
  res.render("home");
});

//CHECK STRING LENGTH
const isValidData = (value, stringLength) => {
  let inValid = new RegExp("^[_A-z0-9]{1,}$");
  let result = inValid.test(value);
  if (result && value.length >= stringLength) {
    return true;
  }
  return false;
};

//REGISTER USER
app.get("/register", (req, res) => {
  res.render("registerr");
});

app.post("/register", async (req, res) => {
  let username = req.body.username;

  let name = req.body.name;
  let role = req.body.role;
  let inputPassword = req.body.password;
  console.log("PASSWORD: ", username);
  let password;

  if (!isValidData(inputPassword, 6)) {
    console.log("Password must be at least 6 characters without space!");
  } else {
    password = inputPassword;
  }

  const newUser = new User({
    username,
    name,
    role,
    activated: false,
  });

  let user = await User.findOne({ username: username });
  const err = "User with the Email already exist!";
  if (user) {
    res.render("registererror", { err });
  } else {
    await User.register(newUser, password);
  }

  // req.session.user_id = user._id;
  let { id } = await User.findOne({ username: username });
  mailer(
    username,
    "Welcome to web",
    "Yes you are very welcome now \n please activate ur account by clicking this link\n \n http://localhost:3000/activate/" +
      id
  ); //Detta lokal host ska ??ndras till dom??nen
  res.render("registerSuccess", { newUser });
  // res.render('login', {user})
});


app.get("/activate/:id", async (req, res) => {
  let user = await User.findOne({ _id: req.params.id });
  if (user) {
    user.activated = true;
    await user.save();
    res.send("Account is activated now");
    res.redirect("http://localhost:3000/welcomeuser?id=" + req.params.id).end();
    res.render("loginWelcome");
  } else {
    res.send("Activation Failed");
  }
});

app.get("/users/edit/:id", async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  res.render("edituser", { user });
});

app.put("/users/edit/:id", async (req, res) => {
  const { id } = await req.params;
  const user = await User.findByIdAndUpdate(id, req.body, {
    runValidators: true,
    new: true,
  });
  user.save();
  res.redirect("/login");
});

app.get("/deleteuser/:id", async (req, res) => {
  const { id } = await req.params;
  await User.findByIdAndDelete(id);

  res.redirect("/");
});

app.get("/login", async (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res, next) => {
  await passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user.username) {
      const worngUser = req.body.username;
      return res.render("wrongEmail", { worngUser });
    }
    if (!user) {
      const worngUser = req.body.username;
      return res.render("wrongpassword", { worngUser });
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect("/users");
    });
  })(req, res, next);
});

app.get("/forgetpass", (req, res) => {
  let tempid = uuid.v4();
  res.render("foreget", { tempid });
});

app.post("/forgetpass/:tempid", async (req, res) => {
  const { tempid } = await req.params;
  const { username } = req.body;

  await User.find({ username }, function (err, user) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/login");
      mailerForget(
        username,
        "Hi",
        "Please click on below link to reset your password \n \n (http://localhost:3000/resetpass/" +
          tempid +
          "/" +
          username
      );
      //Detta lokal host ska ??ndras till dom??nen
    }
  });
});

//RESET PASSWORD
app.get("/resetpass/:tempid/:username", async (req, res) => {
  const { tempid } = await req.params;
  const { username } = await req.params;
  res.render("resetpass", { tempid, username });
});

app.put("/resetpass/:tempid/:username", async (req, res) => {
  const { username } = req.body;
  const { password } = req.body;

  await User.findOne({ username }, (err, user) => {
    if (err) {
      res.send("Password reset Failed");
    } else {
      user.setPassword(password, (error, returnedUser) => {
        if (error) {
          console.log(error);
        } else {
          returnedUser.save();
        }
      });
      res.render("login");
    }
  });
});

app.get("/users", async (req, res) => {
  const allUsers = await User.find({});
  res.render("allUsers", { allUsers });
});

app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  const backery = await Newbackery.find({ "creator.id": id });
  res.render("showuser", { user, backery });
});

app.get("/donate/:id", requiredLogin, async (req, res) => {
  const { id } = req.params;
  const backery = await Newbackery.findById(id);

  res.render("donate", { id, backery });
});

app.get("/users/:username", async (req, res) => {
  const { username } = req.params;
  const user = await User.findById(username);
  res.render("showuser", { user });
});

app.get("/donate/:id", async (req, res) => {
  const { id } = req.params;
  const backery = await Newbackery.findById(id);
  res.render("donate", { id, backery });
});

app.post("/d", async (req, res) => {
  const donated = new Donate(req.body);
  donated.backeryId = req.body.backeryId;
  const donator = await User.findById(req.body.doneatorId);
  donated.donatorsname = donator.name;
  donated.date = new Date().toLocaleDateString("fa-IR");
  await donated.save();
  res.redirect("/");
});

app.get("/donateconfirm/:id/:bid", async (req, res) => {
  const { id } = req.params;
  const { bid } = req.params;
  const donate = await Donate.findById(id);
  const backery = await Newbackery.findById(bid);
  res.render("donateconfirm", { donate, backery });
});

app.put("/donateconfirm/:id/:bid", async (req, res) => {
  const { id } = req.params;
  const { bid } = req.params;
  const confirmation = req.body.confirmation;
  const confirmedAmount = Number(req.body.confirmedAmount);
  const donate = await Donate.findByIdAndUpdate(id, {
    confirmation: confirmation,
    confirmedAmount: confirmedAmount,
  });
  donate.confirmation = confirmation;
  if (donate.confirmation != "Yes" && confirmedAmount != 0) {
    donate.save();
    res.send("You have to confirm amount");
  }
  donate.confirmedAmount = confirmedAmount;
  const backery = await Newbackery.findById(bid);

  const newAmount = backery.totalDonatedAmount + confirmedAmount;
  console.log("NEW AMOUNT", newAmount)


  await Newbackery.findByIdAndUpdate(bid, {"totalDonatedAmount":newAmount});
  donate.save();
  res.redirect(`/backeries`);
});

app.get("/editconfiremdamount/:did/:bid", async (req, res) => {
  const { did } = req.params;
  const { bid } = req.params;
  const donate = await Donate.findById(did);
  const backery = await Newbackery.findById(bid);
 
  res.render("editconfirmed", { donate, backery });
});

app.put("/editconfiremdamount/:did/:bid", async (req, res) => {
  const { did } = req.params;
  const { bid } = req.params;
  const donate = await Donate.findById(did);
  donate.newConfirmedAmount = +req.body.newConfirmedAmount;
  const g=donate.confirmedAmount
  donate.confirmedAmount = donate.newConfirmedAmount;
  
  donate.save()

  const backery = await Newbackery.findById(bid);
  
  backery.totalDonatedAmount =
    backery.totalDonatedAmount +
    donate.newConfirmedAmount -
    g;
  
   backery.save()
  // const backery1 = await Newbackery.findByIdAndUpdate(bid, {
  //   totalDonatedAmount: newTotal,
  // });

  res.redirect("/");
});

app.get("/search", (req, res) => {
  res.render("search");
});
app.get("/search/provience", (req, res) => {
  res.render("searchp");
});
app.post("/search/provience", async (req, res) => {
  const input = req.body.provience;
  const search = input.toLowerCase();
  let query = {
    $or: [{ provience: search }, { city: search }, { district: search }],
  };
  const backery = await Newbackery.find(query);
  res.render("resultp", { backery });
});

app.get("/search/village", (req, res) => {
  res.render("searchv");
});
app.post("/search/village", async (req, res) => {
  const input = req.body.vi;
  const search = input.toLowerCase();
  let query = {
    $or: [{ village: search }],
  };
  const backery = await Newbackery.find(query);
  res.render("resultP", { backery });
});

app.get("/search/street", (req, res) => {
  res.render("searchStLn");
});
app.post("/search/street", async (req, res) => {
  const input = req.body.searchKey;
  const search = input.toLowerCase();
  let query = {
    $or: [{ Street: search }, { line: search }],
  };

  const backery = await Newbackery.find(query);
  res.render("resultp", { backery });
});

app.get("/search/mobilenumber", (req, res) => {
  res.render("searchMnPc");
});

app.post("/search/mobilenumber", async (req, res) => {
  const input = req.body.searchKey;
  let query = {
    $or: [{ mobileNumber: input }, { postCode: input }],
  };
  const backery = await Newbackery.find(query);
  res.render("resultp", { backery });
});

app.get("/search/economylevel", (req, res) => {
  res.render("searchel");
});

app.post("/search/economylevel", async (req, res) => {
  const input = req.body.searchKey;
  const backery = await Newbackery.find()
    .where("averageMonthlyIncomPerPerson")
    .lte(input)
    .exec();
  res.render("resultp", { backery });
});

app.get("/search/numberpoor", (req, res) => {
  res.render("searchNPP");
});
app.post("/search/numberpoor", async (req, res) => {
  const input = req.body.searchKey;
  const backery = await Newbackery.find()
    .where("numberOfPoorPeople")
    .lte(input)
    .exec();
  res.render("resultp", { backery });
});

app.post("/api/login", async (req, res, next) => {
  await passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(404).send("Username or Password incorrect!");
    } else if (!user.activated) {
      return res.status(404).send("User is not Activated, pls Activate!");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res
        .status(200)
        .send({ id: user._id, username: user.username, role: user.role });
    });
  })(req, res, next);
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.use((req, res) => {
  res.status(404).send(`<h1>The page is not defined</h1>`);
});

app.listen(3000, () => {
  console.log("BACKERY SERVER RUNNING!");
});
