/**
 * Name: Eliott Yoo, John You
 * Date: 12/11/2021
 * Section: CSE 154 AE: Tim Mandzyuk & Nikola Bojanic
 *
 * This is the app.js webservice used by the BoostYou website. This is used to store
 * the data for the BoostYou site; storing user information, listings, and transactions.
 * This also is used by the BoostYou site to access and sift through the said stored data.
 */
'use strict';
const express = require('express');
const app = express();
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const multer = require("multer");
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none());

const SERVER_ERROR = 500;
const INVALID_REQ = 400;
const LOCAL_HOST = 8000;

/**
 * get request of listings, if no params inputted then shows all listings, otherwise shows
 * listing with specific id
 */
app.get('/listings/:id?', async (req, res) => {
  let id = parseInt(req.params.id);
  let query = "SELECT * FROM Listings WHERE id=" + id;
  if (!id) {
    query = "SELECT * FROM Listings ORDER BY id ASC";
  }
  try {
    let db = await (getDBConnection());
    let results = {"listings": await db.all(query)};
    await db.close();
    if (results.listings.length === 0) {
      res.status(INVALID_REQ).send({"error": "no listing found!"});
    } else {
      res.json(results);
    }
  } catch (err) {
    res.status(SERVER_ERROR).send("An error occurred on the server. Try again later.");
  }
});

/**
 * get request of listings, if no params inputted then shows all listings, otherwise shows
 * listing with specific id
 */
app.get('/user/:id', async (req, res) => {
  if (req.params.id) {
    let id = parseInt(req.params.id);
    let query = "SELECT * FROM Users WHERE id=" + id;
    try {
      let db = await (getDBConnection());
      let results = await db.all(query);
      await db.close();
      if (results.length === 0) {
        res.status(INVALID_REQ).send({"error": "no user found!"});
      } else {
        res.json({"user": results[0]});
      }
    } catch (err) {
      res.status(SERVER_ERROR).send("An error occurred on the server. Try again later.");
    }
  } else {
    res.status(INVALID_REQ).send("No id found!");
  }
});

/**
 * post request of user login, if is a valid user, returns an object with key valid and boolean
 * of whether login is successful, request passes username and password parameter
 */
app.post('/user/login', async (req, res) => {
  let query = "SELECT * FROM Users WHERE UPPER(username) = ? AND password = ?";
  if (req.body.username && req.body.password) {
    let username = req.body.username.toUpperCase();
    let password = req.body.password;
    try {
      let db = await (getDBConnection());
      let results = await db.all(query, [username, password]);
      await db.close();
      let user = {};
      if (results.length > 0) {
        user = results[0];
      }
      res.type('json').send({'isValid': results.length > 0, "user": user});
    } catch (err) {
      res.status(SERVER_ERROR).send("An error occurred on the server. Try again later.");
    }
  } else {
    res.status(INVALID_REQ).send("Invalid parameters... please try again!");
  }
});

/**
 * post request for creating a new user. Checks to see if user already exists, if not, then returns
 * a new userID and inserts it into the database, otherwise, the database will not update and it
 * will return the userID.
 */
app.post('/user/create', async (req, res) => {
  let query = "SELECT * FROM Users WHERE ? = UPPER(username)";
  if (req.body.username && req.body.password) {
    let username = req.body.username;
    let test = username.toUpperCase();
    let password = req.body.password;
    let db = await (getDBConnection());
    try {
      let results = await db.all(query, [test]);
      if (results.length > 0) {
        res.send({"exists": true, 'id': results[0].id});
        return;
      }
      let insert = "INSERT INTO Users (username, password) values (?, ?)";
      let last = await db.run(insert, [username, password], () => {
        return this.lastID;
      });
      res.send({"exists": false, 'id': last.lastID});
    } catch (err) {
      res.status(SERVER_ERROR).send("An error occurred on the server. Try again later.");
    } finally {
      await db.close();
    }
  } else {
    res.status(INVALID_REQ).send("Invalid parameters... please try again!");
  }
});

/**
 * Post request to confirm a succesful transaction. If there is available stock for the product,
 * updates the stock and returns a plain text string response of the confirmation code.
 * Passes in the userID of the user and listingID from the listing as parameters.
 *
 */
app.post('/user/purchase', async (req, res) => {
  let insert = "INSERT INTO Transactions (userID, listingID, time, stock) VALUES (?, ?, " +
  "datetime('now', 'localtime'), ?)";
  let test = "SELECT stock FROM Listings WHERE id = ?";
  let confirmation =
  "SELECT id FROM Transactions WHERE userID = ? AND listingID = ? ORDER BY id DESC LIMIT 1";
  let updateStock = "UPDATE Listings SET stock = stock - ? WHERE id = ?";
  if (req.body.userID && req.body.listingID && req.body.stock) {
    let userID = req.body.userID;
    let listingID = req.body.listingID;
    let stock = req.body.stock;
    try {
      let db = await (getDBConnection());
      let checkStock = await db.all(test, listingID);
      if (checkStock[0]['stock'] <= stock) {
        res.type('text').send("Out of stock! Please try again later!");
      } else {
        await db.run(updateStock, [stock, listingID]);
        await db.run(insert, [userID, listingID, stock]);
        let results = await db.all(confirmation, [userID, listingID]);
        await db.close();
        res.type('text').send(results[0]['id'].toString());
      }
    } catch (err) {
      res.status(SERVER_ERROR).send("An error occurred on the server. Try again later.");
    }
  } else {
    res.status(INVALID_REQ).send("Invalid parameters... please try again!");
  }
});

/**
 * gets the transaction data of a user id
 */
app.get('/transactions/:id', async (req, res) => {
  let id = req.params.id;
  if (!id) {
    res.status(INVALID_REQ).send({"exists": false, "message": 'No userID found!'});
  }
  let query = "SELECT t.id, t.time, t.stock, l.price " +
  "FROM Transactions as T, Listings as L, Users as U WHERE " +
  "l.id = t.listingId AND u.id = t.userId AND t.userId = ?";
  try {
    let db = await (getDBConnection());
    let results = await db.all(query, [id]);
    await db.close();
    res.json({"results": results});
  } catch (err) {
    res.status(SERVER_ERROR).send("An error occurred on the server. Try again later.");
  }
});

/**
 * post request for creating and returning a new listing from the boost database.
 */
app.post('/listings/create', async (req, res) => {
  let username = req.body.username;
  let rank = req.body.rank;
  let region = req.body.region;
  let description = req.body.description;
  let price = req.body.price;
  let stock = req.body.stock;
  let insert = "INSERT INTO Listings (username, rank, region, description, price, stock)" +
  "VALUES (?,?,?,?,?,?)";
  if (rank && region && description && price && stock && username) {
    try {
      let db = await (getDBConnection());
      await db.run(insert, [username, rank, region, description, price, stock]);
      let query = "SELECT * FROM listings";
      let results = {"listings": await db.all(query)};
      await db.close();
      res.json(results);
    } catch (err) {
      res.status(SERVER_ERROR).send("An error occurred on the server. Try again later.");
    }
  } else {
    res.status(INVALID_REQ).send("Invalid parameters... please try again!");
  }
});

/**
 * get request getting the filtered listings
 */
app.post('/listings/search', async (req, res) => {
  let search = req.body.query.toUpperCase();
  let rank = req.body.rank.toUpperCase();
  let price = req.body.price;
  let region = req.body.region.toUpperCase();
  let stock = req.body.stock;
  if (stock === 0) {
    stock = null;
  }
  if (price === 0) {
    price = null;
  }
  if (rank === '') {
    rank = null;
  }
  if (region === '') {
    region = null;
  }
  let allParams = [search, rank, price, region, stock];
  let insert = createParams(allParams);
  let query = makeQuery(search, rank, price, region, stock);
  try {
    let db = await (getDBConnection());
    let results = {"listings": await db.all(query, insert)};
    res.json(results);
  } catch (err) {
    res.status(SERVER_ERROR).send("An error occurred on the server. Try again later.");
  }
});

/**
 * creates the parameters for the query
 * @param {Array} allParams - the parameters of the query
 * @returns {Array} - the valid user inputted parameters
 */
function createParams(allParams) {
  let insert = [];
  for (let i = 0; i < allParams.length; i++) {
    let param = allParams[i];
    if (param) {
      insert.push(param);
    }
  }
  return insert;
}

/**
 * makes the search query based on the given input
 * @param {String} search - search query
 * @param {String} rank - rank of listing
 * @param {int} price - price of listing wanted
 * @param {String} region - region desired
 * @param {int} stock - amount of stock required
 * @return {String} returns the query for the listings
 */
function makeQuery(search, rank, price, region, stock) {
  let query = "SELECT * FROM LISTINGS";
  let filters = [search, rank, price, region, stock];
  let headers = ['username', 'rank', 'price', 'region', 'stock'];
  let isFirst = true;
  for (let i = 0; i < filters.length; i++) {
    let filter = filters[i];
    let header = headers[i];
    if (filter) {
      let operator = " =";
      if (header === "price") {
        operator = " <=";
      } else if (header === "stock") {
        operator = " >=";
      } else {
        header = "UPPER(" + header + ")";
      }
      if (isFirst) {
        query += " WHERE ";
        isFirst = false;
      } else {
        query += " AND ";
      }
      query += header + operator + " ?";
    }
  }
  return query;
}

/**
 * Establishes a database connection to the database and returns the database object.
 * Any errors that occur should be caught in the function that calls this one.
 * @returns {Object} - The database object for the  connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: 'boost.db',
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static('public'));
const PORT = process.env.PORT || LOCAL_HOST;
app.listen(PORT);