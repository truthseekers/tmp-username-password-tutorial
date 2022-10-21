var express = require("express");
var passport = require("passport");
var LocalStrategy = require("passport-local");
// const localStrategy = require("passport-local").Strategy;
var crypto = require("crypto");
var db = require("../db");

var router = express.Router();

// This is an alternative way of importing and using "LocalStrategy" to see if the failureRedirect still works.
// Also.. WHY is there no object for the usernameField and passwordField?
// passport.use(
//   new localStrategy(function (username, password, cb) {
//     console.log("Does the failureredirect still work???");
//     db.get(
//       "SELECT * FROM users WHERE username = ?",
//       [username],
//       function (err, row) {
//         if (err) {
//           console.log("Returning the ERROR");
//           return cb(err);
//         }
//         if (!row) {
//           console.log(
//             "Returning a NULL error but a message as the last arg to cb"
//           );
//           return cb(null, false, {
//             message: "Incorrect username or password.",
//           });
//         }

//         /////////////////////////// Begin:  Not sure where this goes
//         passport.serializeUser(function (user, cb) {
//           process.nextTick(function () {
//             cb(null, { id: user.id, username: user.username });
//           });
//         });

//         passport.deserializeUser(function (user, cb) {
//           process.nextTick(function () {
//             return cb(null, user);
//           });
//         });
//         ///////////////////////////////// End: Not sure where this goes
//         console.log("password in passport.use: ", password);
//         crypto.pbkdf2(
//           password,
//           row.salt,
//           310000,
//           32,
//           "sha256",
//           function (err, hashedPassword) {
//             console.log("pbkdf2 in the thing: hashed", hashedPassword);
//             console.log("normal: ", password);
//             if (err) {
//               console.log("error in the passport.use version of crypto.pbkdf2");
//               return cb(err);
//             }
//             if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
//               console.log("errrrr...");
//               return cb(null, false, {
//                 message: "Incorrect username or password.",
//               });
//             }
//             return cb(null, row);
//           }
//         );
//       }
//     );
//   })
// );

passport.use(
  "signup",
  new LocalStrategy(function verify2(username, password, cb) {
    var salt = crypto.randomBytes(16);

    console.log("username in passport.use signup: ", username);
    console.log("password in passport.use signup: ", password);

    // console.log("1. grr. req.body: ", req.body);

    crypto.pbkdf2(
      password,
      salt,
      310000,
      32,
      "sha256",
      function (err, hashedPassword) {
        2;
        console.log(
          "2. in callback second param of crypto.pbkdf2. hashedPass: ",
          hashedPassword
        );
        if (err) {
          console.log("3 err in the callback? ", err);
          return next(err);
        }
        db.run(
          "INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)",
          [username, hashedPassword, salt],
          function (err) {
            if (err) {
              return next(err);
            }
            console.log(
              "in db.run inserting the user. Not sure what to do now."
            );
            var user = {
              id: this.lastID, // This probably won't work.
              username: username,
            };
            console.log("user in the signup stuff: ", user);
            // console.log("hashedPassword: ", hashedPassword);
            return cb(null, user);
            // Lovely. I do need req.
            // req.login(user, function (err) {
            //   console.log("4. logging in from the signup braahh");
            //   if (err) {
            //     console.log("5. here's the error spot?: ", err);
            //     return next(err);
            //   }
            //   res.redirect("/");
            // });
          }
        );
      }
    );
  })
);

// This might go in auth?
// This is the original!!!
passport.use(
  "login",
  new LocalStrategy(function verify(username, password, cb) {
    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      function (err, row) {
        if (err) {
          console.log("Returning the ERROR");
          return cb(err);
        }
        if (!row) {
          console.log(
            "Returning a NULL error but a message as the last arg to cb"
          );
          return cb(null, false, {
            message: "Incorrect username or password.",
          });
        }

        /////////////////////////// Begin:  Not sure where this goes
        passport.serializeUser(function (user, cb) {
          process.nextTick(function () {
            cb(null, { id: user.id, username: user.username });
          });
        });

        passport.deserializeUser(function (user, cb) {
          process.nextTick(function () {
            return cb(null, user);
          });
        });
        ///////////////////////////////// End: Not sure where this goes
        console.log("password in passport.use: ", password);
        crypto.pbkdf2(
          password,
          row.salt,
          310000,
          32,
          "sha256",
          function (err, hashedPassword) {
            console.log("pbkdf2 in the thing: hashed", hashedPassword);
            console.log("normal: ", password);
            if (err) {
              console.log("error in the passport.use version of crypto.pbkdf2");
              return cb(err);
            }
            if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
              console.log("errrrr...");
              return cb(null, false, {
                message: "Incorrect username or password.",
              });
            }
            console.log("row.. hopefully user?: ", row);
            cb(null, row); // I assume "returning" the cb would terminate the middleware chain?
            // return cb(null, row); original. why are they returning it and not just calling?
          }
        );
      }
    );
  })
);

router.get("/login", function (req, res, next) {
  console.log("At the login route...");
  res.render("login");
});

router.post(
  "/login/password",
  // made the name of this authentication strategy "login".
  passport.authenticate("login", {
    // passport.authenticate("local", { "local" is the "name" of the strategy. "local" I think is a default? If no name is given use local.
    successRedirect: "/",
    failureRedirect: "/failure",
    // failureRedirect: "/login",
  }),
  function (req, res, next) {
    console.log("holy hell these docs are awful");
  }
);

router.get("/failure", function (req, res, next) {
  res.send("FAILED!!!");
});

router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.get("/signup", function (req, res, next) {
  res.render("signup");
});

router.post(
  "/signup",
  passport.authenticate("signup", {
    successRedirect: "/",
    failureRedirect: "/failure",
  })
);

// router.post("/signup", function (req, res, next) {
//   var salt = crypto.randomBytes(16);

//   console.log("1. grr. req.body: ", req.body);

//   crypto.pbkdf2(
//     req.body.password,
//     salt,
//     310000,
//     32,
//     "sha256",
//     function (err, hashedPassword) {
//       2;
//       console.log(
//         "2. in callback second param of crypto.pbkdf2. hashedPass: ",
//         hashedPassword
//       );
//       if (err) {
//         console.log("3 err in the callback? ", err);
//         return next(err);
//       }
//       db.run(
//         "INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)",
//         [req.body.username, hashedPassword, salt],
//         function (err) {
//           if (err) {
//             return next(err);
//           }
//           var user = {
//             id: this.lastID,
//             username: req.body.username,
//           };
//           req.login(user, function (err) {
//             console.log("4. logging in from the signup braahh");
//             if (err) {
//               console.log("5. here's the error spot?: ", err);
//               return next(err);
//             }
//             res.redirect("/");
//           });
//         }
//       );
//     }
//   );
// });

module.exports = router;
