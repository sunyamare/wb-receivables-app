import { Meteor } from "meteor/meteor";
import { WebApp } from "meteor/webapp";
import bodyParser from "body-parser";
import { InvoicesCollection } from "/imports/api/invoices";
import {
  fetchInvoices,
  upsertInvoices,
} from "/imports/server/invoiceFunctions";
import { emailToFilteredObject } from "/imports/server/emailToFilteredObject";
import dotenv from "dotenv";
dotenv.config({
  path: Assets.absoluteFilePath(".env"),
});
const multer = require("multer");
const multerUpload = multer();

// For requests with content-type JSON:
WebApp.connectHandlers.use("/email", bodyParser.json());
// For requests with content-type application/x-www-form-urlencoded
WebApp.connectHandlers.use("/email", bodyParser.urlencoded({ extended: true }));
// Use Multer (for multi-form requests) with WebApp but none because there won't be any files
WebApp.connectHandlers.use("/email", multerUpload.none());
// Then your handler:
WebApp.connectHandlers.use("/email", (req, res) => {
  // logging the request body for test purposes
  console.log("******************");
  const envelope = JSON.parse(req.body.envelope);
  console.log("envelope.from", envelope.from);
  console.log("req.body.subject", req.body.subject);
  // multiline string to json object
  const email = `${req.body.email}`;
  console.log("************************************************");
  console.log(emailToFilteredObject(email));

  // response to sender
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.writeHead(200);
  res.end(
    JSON.stringify({
      status: "ok",
    })
  );
});

async function fetchAndUpsertInvoices() {
  const result = await fetchInvoices();
  try {
    upsertInvoices(result.data.invoice);
  } catch (err) {
    console.error(err);
  }
}

Meteor.startup(() => {
  // fetch invoices and update the "invoices" collection
  fetchAndUpsertInvoices();

  // create index for the invid field in the collection "invoices" to ensure no duplicates (2nd layer, 1st is upsert based on invid)
  InvoicesCollection.rawCollection().createIndex(
    { invid: 1 },
    { unique: true }
  );
});
