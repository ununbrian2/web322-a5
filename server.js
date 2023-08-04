/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part of this
*  assignment has been copied manually or electronically from any other source (including web sites) or 
*  distributed to other students.
* 
*  Name: Pa Yan Tam Student ID: 175922210 Date: 4 August 2021
*
*  Cyclic Web App URL: ________________________________________________________
*
*  GitHub Repository URL: https://github.com/ununbrian2/web322-a5
*
********************************************************************************/ 

const express = require("express");
const path = require("path");
const storeService = require("./store-service");
const app = express();
const exphbs = require("express-handlebars");
const moment = require("moment");

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          '<li class="nav-item"><a ' +
          (url == app.locals.activeRoute
            ? 'class="nav-link active"'
            : 'class="nav-link"') +
          ' href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      formatDate: function (date, format) {
        return moment(date).format(format);
      },
    },
  })
);
app.set("view engine", ".hbs");
const PORT = process.env.PORT || 8080;

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: "dsrw34w2e",
  api_key: "949281391361428",
  api_secret: "cGZdB60aRRJcmYRT39wdMU77cFA",
});

const upload = multer();

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.redirect("/shop");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/items/add", (req, res) => {
  res.render("addItem");
});

app.get("/categories/add", (req, res) => {
  res.render("addCategory");
});

app.get("/shop/:id", (req, res) => {
  let category = req.query.category;
  let itemID = req.params.id;

  Promise.all([
    storeService.getItemById(itemID),
    storeService.getPublishedItemsByCategory(category),
    storeService.getAllCategories(),
  ])
    .then(([item, items, categories]) => {
      res.render("shop", {
        data: {
          post: item,
          posts: items,
          categories: categories,
          viewingCategory: category,
        },
      });
    })
    .catch((err) => {
      res.render("shop", {
        data: {
          message: "Unable to fetch requested data",
          categoriesMessage: "Unable to fetch categories",
        },
      });
    });
});

app.get("/shop", (req, res) => {
  let getItems;
  if (req.query.category) {
    getItems = storeService.getPublishedItemsByCategory(req.query.category);
  } else {
    getItems = storeService.getPublishedItems();
  }

  const getCategories = storeService.getAllCategories();

  Promise.all([getItems, getCategories])
    .then(([items, categories]) => {
      let post, posts;
      if (items.length > 0) {
        post = items[0];
        posts = items.slice(1);
      }

      res.render("shop", {
        data: {
          post,
          posts,
          categories,
        },
      });
    })
    .catch((err) => {
      res.render("shop", {
        data: {
          message: err.message,
          categoriesMessage: "Could not fetch categories",
        },
      });
    });
});

app.get("/items", (req, res) => {
  let dataPromise;

  if (req.query.category) {
    dataPromise = storeService.getItemsByCategory(req.query.category);
  } else if (req.query.minDate) {
    dataPromise = storeService.getItemsByMinDate(req.query.minDate);
  } else {
    dataPromise = storeService.getAllItems();
  }

  dataPromise
    .then((items) => {
      if (items.length > 0) {
        res.render("items", { items: items });
      } else {
        res.render("items", { message: "No results found." });
      }
    })
    .catch((err) => {
      res.render("items", { message: "Error occurred: " + err });
    });
});

app.get("/items/delete/:id", (req, res) => {
  storeService
    .deleteItemById(req.params.id)
    .then(() => {
      res.redirect("/items");
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
});

app.get("/item/:value", (req, res) => {
  storeService
    .getItemById(req.params.value)
    .then((item) => {
      res.json(item);
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

app.post("/items/add", upload.single("featureImage"), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      return result;
    }

    upload(req).then((uploaded) => {
      processItem(uploaded.url);
    });
  } else {
    processItem("");
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;
    req.body.price = parseFloat(req.body.price);
    req.body.category = parseFloat(req.body.category);
    storeService
      .addItem(req.body)
      .then(() => res.redirect("/items"))
      .catch((err) => res.status(500).send({ message: err }));
  }
});

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.get("/categories", (req, res) => {
  storeService
    .getAllCategories()
    .then((categories) => {
      if (categories.length > 0) {
        res.render("categories", { categories: categories });
      } else {
        res.render("categories", { message: "No results found." });
      }
    })
    .catch((err) => {
      res.render("categories", { message: "Error occurred: " + err });
    });
});

app.post("/categories/add", (req, res) => {
  storeService
    .addCategory(req.body)
    .then(() => res.redirect("/categories"))
    .catch((err) => res.status(500).send({ message: err }));
});

app.get("/items/delete/:id", (req, res) => {
  storeService
    .deleteItemById(req.params.id)
    .then(() => res.redirect("/items"))
    .catch((err) => res.status(500).send({ message: err }));
});

app.get("/categories/delete/:id", (req, res) => {
  storeService
    .deleteCategoryById(req.params.id)
    .then(() => res.redirect("/categories"))
    .catch((err) => res.status(500).send({ message: err }));
});

app.use((req, res) => {
  res.status(404).render("404");
});

storeService
  .initialize()
  .then(() => {
    app.listen(process.env.PORT || 8080, () => {
      console.log("Express http server listening on 8080");
    });
  })
  .catch((err) => {
    console.error(`Failed to initialize store service: ${err}`);
  });
