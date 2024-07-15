const dotenv = require("dotenv").config();
const https = require("https"); // new
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const puppeteer = require("puppeteer");
const { errorHandler } = require("./middleware/errorMiddleware.js");
const { scrapeLogic } = require("./scrapeLogic.js");
const { getCountryCode } = require("./countryCodes.js");

const User = require("./models/User.js");
const app = express();
// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(bodyParser.json());
app.use(express.static("public"));
// app.use(cors());

app.use(
  cors({
    origin: [
      "http://127.0.0.1:5173",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5000",
      "http://127.0.0.1:5000",
      "exp://192.168.1.49:8081",
      "192.168.1.49:8081",
      process.env.FRONTEND_URL,
      process.env.BACKEND_URL,
      "*",
    ],
    credentials: true,
  })
);
//references
//puppeteer and onrender config with docker: https://www.youtube.com/watch?v=6cm6G78ZDmM&t=320s
// Error Middleware
app.use(errorHandler);

// Middleware to extract the IP address
app.use((req, res, next) => {
  const clientIp =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "";

  req.clientIp = clientIp;

  next();
});

// -momery unleaked---------
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;
const backend = process.env.BACKEND_URL;
const frontend = process.env.FRONTEND_URL;
const app_id = process.env.FACEBOOK_APP_ID;
const app_access_token = process.env.FACEBOOK_ACCESS_TOKEN;

const pixelId = process.env.FACEBOOK_PIXEL_ID;
const pixel_access_token = process.env.FACEBOOK_PIXEL_ACCESS_TOKEN;

//Step1: initial path
const keitaroFirstCampaign = process.env.KEITAROFIRSTCAMPAIGN;
const activeGame = process.env.ACTIVEGAMELINK;
const googleLink = process.env.GOOGLELINK;
// Connect to DB and start server

// Helper function to hash data
// function hashData(data) {
//   return crypto.createHash("sha256").update(data).digest("hex");
// }

function hashData(data) {
  if (!data) return null;
  return crypto
    .createHash("sha256")
    .update(data.trim().toLowerCase())
    .digest("hex");
}

//testing purchase call from server

async function sendPurchaseOnServer() {
  const url = `${backend}/create_facebook_purchase_event?fbclid=123&external_id=user125`;

  try {
    const response = await axios.get(url);
    // if (response.data) {
    //   console.log({ response: response.data });
    // }
  } catch (error) {
    console.log({ error });
  }
}

async function fetchCountryCode() {
  // Example usage:
  // const countryName = "United States";
  const countryName = "Pakistan";
  const countryCode = getCountryCode(countryName);
  let hashedCountryCode = null;

  if (countryCode) {
    console.log(`Normalized format: ${countryCode}`);
    hashedCountryCode = hashData(countryCode);
    console.log(`Hashed format: ${hashedCountryCode}`);
  } else {
    console.log("Country not found");
  }
}

// fetchCountryCode()
// sendPurchaseOnServer();

//http://localhost:4000/create_facebook_purchase_event?fbclid=123&value=25

//http://localhost:4000/create_facebook_purchase_event?fbclid=123&external_id=user125
//http://localhost:4000/create_facebook_lead_event?fbclid=123&external_id=user125

// Endpoint to create Facebook purchase event
app.get("/create_facebook_purchase_event", async (req, res) => {
  const event = "purchase";
  const { client_ip_address, fbclid, external_id } = req.query;

  console.log({ serverParams: req.query });
  // http://localhost:5173/purchase/123/user245
  let url = "";

  if (client_ip_address && fbclid && external_id) {
    url = `${frontend}/${event}/${client_ip_address}/${fbclid}/${external_id}`;
  }

  if (!client_ip_address && fbclid && external_id) {
    url = `${frontend}/${event}/${fbclid}/${external_id}`;
  }

  if (!client_ip_address && !fbclid && external_id) {
    url = `${frontend}/${event}/${external_id}`;
  }

  console.log({ "Purchase Redirect Url": url });
  // openUrl(url);
  scrapeLogic(url);
  // res.redirect(url);
});
//testing lead directly
async function sendLeadOnServer() {
  const url = `${backend}/create_facebook_lead_event?fbclid=123&external_id=user125`;

  try {
    const response = await axios.get(url);
    // if (response.data) {
    //   console.log({ response: response.data });
    // }
  } catch (error) {
    console.log({ error });
  }
}

// sendLeadOnServer();

// Endpoint to create Facebook lead event
app.get("/create_facebook_lead_event", async (req, res) => {
  const event = "lead";
  const { client_ip_address, fbclid, external_id } = req.query;
  console.log({ serverParams: req.query });
  // http://localhost:5173/lead/123/user245
  let url = "";

  if (client_ip_address && fbclid && external_id) {
    url = `${frontend}/${event}/${client_ip_address}/${fbclid}/${external_id}`;
  }

  if (!client_ip_address && fbclid && external_id) {
    url = `${frontend}/${event}/${fbclid}/${external_id}`;
  }

  if (!client_ip_address && !fbclid && external_id) {
    url = `${frontend}/${event}/${external_id}`;
  }

  console.log({ "Lead Redirect Url": url });
  // openUrl(url)

  res.redirect(url);
});

// Endpoint to create Facebook lead event
app.get("/facebook_event_notification", async (req, res) => {
  const { event } = req.query;

  if (event) {
    console.log({ fB_event: event });
  }
});

//==============================={Main calls}================================================
// Route to handle requests
// path: "http://localhost:4000/initialize_app"
//path; "https://dm-wings-server.onrender.com/initialize_app"
//retructure: https://dm-wings-server.onrender.com/initialize_app
//returns: "https://wingsofflimitsprivacy.xyz/WngsffLmtsBwfdxs"
// adding params: `https://wingsofflimitsprivacy.xyz/WngsffLmtsBwfdxs?sub_id_1=NPR`
//========{before app install}====================
// adding params: `https://dm-wings-server.onrender.com?sub_id_1=NPR`
//========{after app install}====================
// adding params: `https://dm-wings-server.onrender.com?advertiser_tracking_id=123`

//==========={Local host activities}================================================

//========{before app install}====================
// adding params: `http://localhost:4000?sub_id_1=NPR`
//========{after app install}====================
// adding params: `http://localhost:4000?advertiser_tracking_id=123`

//second campaign options: "https://wingsofflimitsprivacy.xyz/WngsffLmtsBwfdxs?fbclid={fbclid}&utm_campaign={{campaign.name}}&utm_source={{site_source_name}}&sub_id_1={sub1}&sub_id_2={sub2}&sub_id_3={sub3}&sub_id_4={sub4}&sub_id_5={sub5}&sub_id_6={sub6}&fbclid={fbclid}&pixel=714981180129689&token=EAAEcIRgo4MIBO7Gb3oGV6rbcjXOiZBhplvcAeWAXc6Xfn0xZAv02XEts1RyAcV7zEbY6mbYBqPgjUKY6PWhRrRf0YWHkzBToto5Q6rSJ4RqDWg8u84mKzhC28AeZBv1EXYGfCj1NZBTNPTH7ejqdUtCZA7ZCIgvZAZBuGqEpySTJOCgz6aIQawJfcsQBRGiuTiPh7AZDZD&domain=https://av-gameprivacypolicy.site/app&purchase_amount=10&app_id=271837082690554&access_token=EAAD3PADAIZCoBO4wRTyTrOGa74Q341dAStsOZATIKLKcJxWijXjjBGNrXDPg5gkgdRP5cAYBL30GJErnU0y4sQaCFvZB27Ofh898y6a87PEEOxRd1eIZAgzCrZBEhl8BZAz8ii76OwOT5FvvHqSlXJNmy2alIlrCsm9zDDRLPFPTvZBesQaZAXW5ZCwSh9ZBvsCDbO"

//=================++++{keitaro endpoint }=================================================

const getKeitaroSecondLinkWithUser = async (req, url, userData) => {
  console.log({ url });
  let link = "";

  const userExists = userData;

  try {
    // Forward the request to Server 2
    //========={start: execute later}=======================================
    console.log({ stage2: "calling keitaro campaign 1" });

    // Create an HTTPS agent that ignores SSL certificate errors
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const response = await axios.get(url, {
      headers: req.headers, // Forward original headers if needed
      httpsAgent: agent, // Use the agent that ignores SSL errors
    });

    if (response.data) {
      link = response.data;

      if (link.startsWith("http://") || link.startsWith("https://")) {
        console.log("The string starts with 'http' or 'https'.");
        link = link; // without params
        console.log({
          stage4: "sending keitaro campaign 2 link with params if available",
        });

        if (userExists && userExists.affiliateLink) {
          link = link + `${userExists?.affiliateLink}`; // adding affiliate link
        }
      } else {
        console.log({
          stage5: "return non https value but html for other countries",
        });
        link = activeGame;
      }
    }
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    console.log(message);
    console.log({
      stage6: "return error 404 for unsupported region",
    });
    link = googleLink;
    // return link;
  }

  console.log({ userLink: link });

  return link;
};

// const link1 =
//   "https://www.dmtgames.pro/?sub1=NPR&sub2=291735090&fbp=714981180129689&token=EAAEcIRgo4MIBO7Gb3oGV6rbcjXOiZBhplvcAeWAXc6Xfn0xZAv02XEts1RyAcV7zEbY6mbYBqPgjUKY6PWhRrRf0YWHkzBToto5Q6rSJ4RqDWg8u84mKzhC28AeZBv1EXYGfCj1NZBTNPTH7ejqdUtCZA7ZCIgvZAZBuGqEpySTJOCgz6aIQawJfcsQBRGiuTiPh7AZDZD";
// const link2 =
//   "https://www.dmtgames.pro/?sub1=NPR&fbp=714981180129689&token=EAAEcIRgo4MIBO7Gb3oGV6rbcjXOiZBhplvcAeWAXc6Xfn0xZAv02XEts1RyAcV7zEbY6mbYBqPgjUKY6PWhRrRf0YWHkzBToto5Q6rSJ4RqDWg8u84mKzhC28AeZBv1EXYGfCj1NZBTNPTH7ejqdUtCZA7ZCIgvZAZBuGqEpySTJOCgz6aIQawJfcsQBRGiuTiPh7AZDZD";
// const link3 =
//   "https://www.dmtgames.pro/?sub1=NPR&sub2=291735090&sub3=NPR&sub4=vidos1&sub5={{ad.id}}&sub6=method1&fbp=714981180129689&token=EAAEcIRgo4MIBO7Gb3oGV6rbcjXOiZBhplvcAeWAXc6Xfn0xZAv02XEts1RyAcV7zEbY6mbYBqPgjUKY6PWhRrRf0YWHkzBToto5Q6rSJ4RqDWg8u84mKzhC28AeZBv1EXYGfCj1NZBTNPTH7ejqdUtCZA7ZCIgvZAZBuGqEpySTJOCgz6aIQawJfcsQBRGiuTiPh7AZDZD";

// add advertiser_tracking_id to installed API call in unity app

app.get("/main", async (req, res) => {
  console.log("calling host server");
  //======{request objects}====================================
  const ip = req.clientIp;
  const requestURL = req.originalUrl; // This will include query parameters, if any
  const { user_id } = req.query;

  console.log({ userIPAddress: ip });
  console.log({ requestURL });
  console.log({ Query: req.query });

  //============{state variables}====================================

  let webViewLink = "";
  let userId = "";

  //==================={New User}========================

  /**
   * register user
   * redirect user to app store to install app
   *
   */

  if (!user_id) {
    console.log("new user");
    const newUser = await User.create({
      ipAddress: ip,
      // userLink: updatedLink,
      affiliateLink: requestURL ? requestURL : `/?sub_id_1=organic`, // if there is no request url, then the user is an organic user
    });

    if (newUser) {
      console.log({ "New user created": newUser });
      const appStoreLink = process.env.APP_STORE_LINK;
      console.log("app install in progress");
      return res.redirect(appStoreLink);
    }
  } else if (user_id == "new") {
    // new user
    const userExists = await User.findOne({ ipAddress: ip });
    if (userExists) {
      const userData = userExists;
      webViewLink = await getKeitaroSecondLinkWithUser(
        req,
        keitaroFirstCampaign,
        userData
      );
      userId = userExists?._id;
      await updateAppInstall(req, userId); // this will register new app install only once

      console.log("app launch successful");
      console.log("sending link");
      console.log({ redirectLink: webViewLink });
      const response = {
        userId,
        link: webViewLink,
      };

      res.json(response);
    }
  } else {
    // old user
    userId = user_id;

    const userExists = await User.findById(userId);
    console.log("user exists");
    if (userExists) {
      const userData = userExists;
      webViewLink = await getKeitaroSecondLinkWithUser(
        req,
        keitaroFirstCampaign,
        userData
      );
      userId = userTrackingIdExists?._id;
      await updateAppInstall(req, userId); // this will register new app install only once

      console.log("app launch successful");
      console.log("sending link");
      console.log({ redirectLink: webViewLink });
      const response = {
        userId,
        link: webViewLink,
      };

      res.json(response);
    }
  }
});

app.get("/", async (req, res) => {
  console.log("calling host server");
  //======{request objects}====================================
  const ip = req.clientIp;
  const requestURL = req.originalUrl; // This will include query parameters, if any
  const { user_id } = req.query;

  console.log({ userIPAddress: ip });
  console.log({ requestURL });
  console.log({ Query: req.query });

  //============{state variables}====================================

  let webViewLink = "";
  let userId = "";
  const userExistsByIP = await User.findOne({ ipAddress: ip });

  //==================={New User}========================

  /**
   * register user
   * redirect user to app store to install app
   *
   */

  if (!user_id && !userExistsByIP) {
    console.log("new user");
    const newUser = await User.create({
      ipAddress: ip,
      // userLink: updatedLink,
      affiliateLink: requestURL ? requestURL : `/?sub_id_1=organic`, // if there is no request url, then the user is an organic user
    });

    if (newUser) {
      console.log({ "New user created": newUser });
      const appStoreLink = process.env.APP_STORE_LINK;
      console.log("app install in progress");
      return res.redirect(appStoreLink);
    }
  } else if (!user_id && userExistsByIP) {
    console.log("identified user by ip");
    const userData = userExistsByIP;
    webViewLink = await getKeitaroSecondLinkWithUser(
      req,
      keitaroFirstCampaign,
      userData
    );
    userId = userExistsByIP?._id;
    await updateAppInstall(req, userId); // this will register new app install only once

    console.log("app launch successful");
    console.log("sending link");
    console.log({ redirectLink: webViewLink });
    const response = {
      userId,
      link: webViewLink,
    };

    res.json(response);
  } else if (user_id) {
    userId = user_id;
    console.log("identified verified user");
    const userExists = await User.findById(userId);
    if (userExists) {
      const userData = userExists;
      webViewLink = await getKeitaroSecondLinkWithUser(
        req,
        keitaroFirstCampaign,
        userData
      );
      await updateAppInstall(req, userId); // this will register new app install only once

      console.log("app launch successful");
      console.log("sending link");
      console.log({ redirectLink: webViewLink });
      const response = {
        userId,
        link: webViewLink,
      };

      res.json(response);
    }
  } else {
    console.log("Invalid user");
  }
});

async function checkFacebookAppActicationEvent() {
  const url = `https://graph.facebook.com/${app_id}/activities?access_token=${app_access_token}`;

  const payload = {
    event: "CUSTOM_APP_EVENTS",
    advertiser_tracking_enabled: 1,
    application_tracking_enabled: 1,
    custom_events: [{ _eventName: "fb_mobile_activate_app" }],
    skadnetwork_attribution: {
      version: "2.2",
      source_app_id: app_id,
      conversion_value: 0, // Значение для установки приложения
    },
    user_data: { anon_id: "UNIQUE_USER_ID" },
  };

  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(url, payload, { headers: headers });

    if (response.data) {
      let result = response.data;

      console.log({ result });
      //{ result: { success: true } }
    }
    //====={New update}========================
  } catch (error) {
    // const err = error.response.data;
    console.log(error);
    console.error(error);
    // return { status: err.success, message: err.message };
    // res.json(err);
  }
}
//rename as :pixel_purchase_event
app.get("/create_facebook_purchase_event", async (req, res) => {
  //Install: fb_mobile_install

  const requestURL = req.originalUrl; // This will include query parameters, if any
  const { fbclid, sub_id_10, external_id, date, client_ip_address } = req.query;

  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "";

  console.log({ userIPAddress: ip });
  console.log({ requestURL });
  console.log({ Query: req.query });

  // const sub_id_10 = "";
  const unixTimeNow = Math.floor(Date.now() / 1000);
  console.log({ unixTimeNow });

  const min = 1;
  const max = 9999;
  let randomNumberFloat = Math.random() * (max - min) + min;

  const random = Math.round(randomNumberFloat);
  console.log({ random });

  // Function to generate random number

  if (unixTimeNow && random) {
    console.log({ processing: "calling facebook endpoint" });
    const url = `https://graph.facebook.com/${app_id}/activities?access_token=${app_access_token}`;

    const payload = {
      event: "CUSTOM_APP_EVENTS",
      advertiser_tracking_enabled: 1,
      application_tracking_enabled: 1,
      advertiser_id: "1234",
      action_source: "website",
      event_time: date || unixTimeNow,
      event_source_url: "https://av-gameprivacypolicy.site/app",
      custom_events: [
        {
          _eventName: "fb_mobile_purchase",
          // _eventName: "Purchase", // Standard event name for purchases
          _valueToSum: 10,
          fb_currency: "USD",
        },
      ],
      skadnetwork_attribution: {
        version: "2.2",
        source_app_id: app_id,
        // conversion_value: 0,
        conversion_value: 1,
      },
      user_data: {
        external_id: external_id ? external_id.toString() : "user123",
        // client_ip_address: client_ip_address || ip,
        client_ip_address: client_ip_address || "192.168.1.1",
        client_user_agent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        // fbc: "fb.1.1625247600.abcdefg",
        // fbp: "fb.1.1625247600.1234",
        fbc: `fb.1.${date || unixTimeNow}.${sub_id_10 ? sub_id_10 : "abcdefg"}`,
        fbp: `fb.1.${date || unixTimeNow}.${random}`,
        fbclid: fbclid || null, // Include fbclid if available
      },
    };

    const headers = {
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post(url, payload, { headers: headers });

      if (response.data) {
        let result = response.data;

        console.log({ FB_purchase_event_result: result });
        //{ result: { success: true } }
      }
      //====={New update}========================
    } catch (error) {
      // const err = error.response.data;
      console.log({ FB_purchase_event_error: error });
      // console.error(error);
      if (error.response) {
        // Server responded with a status code outside the range of 2xx
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      } else if (error.request) {
        // No response received
        console.error("Error request data:", error.request);
      } else {
        // Something else happened
        console.error("Error message:", error.message);
      }
    }
  }
});

//conversions api calls
//rename as:conversion_purchase_event
app.get("/create_fb_purchase_event", async (req, res) => {
  const {
    // fbclid,
    sub_id_10,
    external_id,
    date,
    client_ip_address,
    phone,
    email,
    country,
    event_id,
  } = req.query;

  const ip = req.clientIp;

  console.log({ userIPAddress: ip });
  console.log({ requestURL: req.originalUrl });
  console.log({ Query: req.query });

  const unixTimeNow = Math.floor(Date.now() / 1000);
  console.log({ unixTimeNow });

  const min = 1;
  const max = 9999;
  let randomNumberFloat = Math.random() * (max - min) + min;

  const random = Math.round(randomNumberFloat);
  console.log({ random });

  if (unixTimeNow && random) {
    console.log({ processing: "calling facebook endpoint" });

    const pixelId = process.env.FACEBOOK_PIXEL_ID; // Replace with your Pixel ID
    const accessToken = process.env.FACEBOOK_PIXEL_ACCESS_TOKEN; // Replace with your Access Token

    const url = `https://graph.facebook.com/v11.0/${pixelId}/events?access_token=${accessToken}`;

    const payload = {
      data: [
        {
          event_name: "Purchase",
          event_time: date
            ? Math.floor(new Date(date).getTime() / 1000)
            : unixTimeNow,
          action_source: "website",
          event_source_url: "https://av-gameprivacypolicy.site/app",
          event_id: event_id || `event_${unixTimeNow}_${random}`, // add this to pixel data on landing page
          user_data: {
            external_id: external_id ? external_id.toString() : "user123",
            client_ip_address: client_ip_address || ip,
            client_user_agent:
              req.headers["user-agent"] ||
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            fbc: `fb.1.${date || unixTimeNow}.${
              sub_id_10 ? sub_id_10 : "abcdefg"
            }`,
            fbp: `fb.1.${date || unixTimeNow}.${random}`,
            em: email ? [hashData(email.toString())] : null, // Hash and place email in array
            ph: phone ? [hashData(phone.toString())] : null, // Hash and place phone in array
            country: country ? [hashData(country.toString())] : null, // Hash and place country in array//[hashData("us")]
          },
          custom_data: {
            currency: "USD",
            value: 10.0,
          },
        },
      ],
    };

    const headers = {
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post(url, payload, { headers: headers });

      if (response.data) {
        let result = response.data;
        console.log({ FB_purchase_event_result: result });
      }
    } catch (error) {
      console.log({ FB_purchase_event_error: error });
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error request data:", error.request);
      } else {
        console.error("Error message:", error.message);
      }
    }
  }
});

const FB_purchase_event_result = {
  events_received: 1,
  messages: [],
  fbtrace_id: "ArWB9ILWNOQSdiy9JUUaeK2",
};
//rename as :pixel_lead_event
app.get("/create_fb_lead_event", async (req, res) => {
  const {
    // fbclid,
    sub_id_10,
    external_id,
    date,
    client_ip_address,
    phone,
    email,
    country,
    event_id,
  } = req.query;

  const ip = req.clientIp;

  console.log({ userIPAddress: ip });
  console.log({ requestURL: req.originalUrl });
  console.log({ Query: req.query });

  const unixTimeNow = Math.floor(Date.now() / 1000);
  console.log({ unixTimeNow });

  const min = 1;
  const max = 9999;
  let randomNumberFloat = Math.random() * (max - min) + min;

  const random = Math.round(randomNumberFloat);
  console.log({ random });

  if (unixTimeNow && random) {
    console.log({ processing: "calling facebook endpoint" });

    const url = `https://graph.facebook.com/v11.0/${pixelId}/events?access_token=${pixel_access_token}`;

    const payload = {
      data: [
        {
          event_name: "Lead",
          event_time: date
            ? Math.floor(new Date(date).getTime() / 1000)
            : unixTimeNow,
          action_source: "website",
          event_source_url: "https://av-gameprivacypolicy.site/app",
          event_id: event_id || `event_${unixTimeNow}_${random}`, // add this to pixel data on landing page
          user_data: {
            external_id: external_id
              ? [hashData(external_id.toString())]
              : [hashData("12345")],

            client_ip_address: client_ip_address || ip,
            client_user_agent:
              req.headers["user-agent"] ||
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            fbc: `fb.1.${date || unixTimeNow}.${
              sub_id_10 ? sub_id_10 : "abcdefg"
            }`,
            fbp: `fb.1.${date || unixTimeNow}.${random}`,
            em: email ? [hashData(email.toString())] : null, // Hash and place email in array
            ph: phone ? [hashData(phone.toString())] : null, // Hash and place phone in array
            country: country ? [hashData(country.toString())] : null, // Hash and place country in array//[hashData("us")]
          },
        },
      ],
    };

    const headers = {
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post(url, payload, { headers: headers });

      if (response.data) {
        let result = response.data;
        console.log({ FB_lead_event_result: result });
      }
    } catch (error) {
      console.log({ FB_lead_event_error: error });
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error request data:", error.request);
      } else {
        console.error("Error message:", error.message);
      }
    }
  }
});

const FB_lead_event_result = {
  events_received: 1,
  messages: [],
  fbtrace_id: "A9bTo8fGaSixvUR5hOQ7lF9",
};

async function updateAppInstall(req, userId) {
  const userExists = await User.findById(userId);
  if (!userExists.appInstalled) {
    //if app install is false, then goi ahead to confirm app installed as true
    const status = await createFacebookAppInstallEvent(req);
    if (status == true) {
      userExists.appInstalled = true;

      const updatedUser = await userExists.save();

      if (updatedUser) {
        console.log("app installed");
      }
    }
  }
}

async function createFacebookAppInstallEvent(req) {
  const ip = req.clientIp;
  let status = false;

  console.log({ userIPAddress: ip });
  console.log({ requestURL: req.originalUrl });
  console.log({ Query: req.query });

  const unixTimeNow = Math.floor(Date.now() / 1000);
  console.log({ unixTimeNow });

  const min = 1;
  const max = 9999;
  let randomNumberFloat = Math.random() * (max - min) + min;

  const random = Math.round(randomNumberFloat);
  console.log({ random });

  if (unixTimeNow && random) {
    console.log({ processing: "calling facebook endpoint" });

    const url = `https://graph.facebook.com/v11.0/${pixelId}/events?access_token=${pixel_access_token}`;

    const payload = {
      data: [
        {
          event_name: "AppInstall",
          event_time: unixTimeNow,
          // action_source: "website",
          // event_source_url: "https://av-gameprivacypolicy.site/app",
          action_source: "app",
          event_source_url: process.env.APP_STORE_LINK,
          event_id: `event_${unixTimeNow}_${random}`, // add this to pixel data on landing page
          user_data: {
            client_ip_address: ip,
            client_user_agent:
              req.headers["user-agent"] ||
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        },
      ],
    };

    const headers = {
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post(url, payload, { headers: headers });

      if (response.data) {
        let result = response.data;
        console.log({ FB_app_install_event_result: result });
        status = true;
      }
    } catch (error) {
      console.log({ FB_app_install_event_error: error });
      status = false;
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error request data:", error.request);
      } else {
        console.error("Error message:", error.message);
      }
      status = false;
    }
  }
  return status;
}

// testing endpoint
app.get("/create_fb_app_install_event", async (req, res) => {
  const ip = req.clientIp;

  console.log({ userIPAddress: ip });
  console.log({ requestURL: req.originalUrl });
  console.log({ Query: req.query });

  const unixTimeNow = Math.floor(Date.now() / 1000);
  console.log({ unixTimeNow });

  const min = 1;
  const max = 9999;
  let randomNumberFloat = Math.random() * (max - min) + min;

  const random = Math.round(randomNumberFloat);
  console.log({ random });

  if (unixTimeNow && random) {
    console.log({ processing: "calling facebook endpoint" });

    const url = `https://graph.facebook.com/v11.0/${pixelId}/events?access_token=${pixel_access_token}`;

    const payload = {
      data: [
        {
          event_name: "AppInstall",
          event_time: unixTimeNow,
          // action_source: "website",
          // event_source_url: "https://av-gameprivacypolicy.site/app",
          action_source: "app",
          event_source_url: process.env.APP_STORE_LINK,
          event_id: `event_${unixTimeNow}_${random}`, // add this to pixel data on landing page
          user_data: {
            client_ip_address: ip,
            client_user_agent:
              req.headers["user-agent"] ||
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        },
      ],
    };

    const headers = {
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post(url, payload, { headers: headers });

      if (response.data) {
        let result = response.data;
        console.log({ FB_app_install_event_result: result });
      }
    } catch (error) {
      console.log({ FB_app_install_event_error: error });
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error request data:", error.request);
      } else {
        console.error("Error message:", error.message);
      }
    }
  }
});

const FB_app_install_event_result = {
  events_received: 1,
  messages: [],
  fbtrace_id: "AWcieJkmzGCLAgp-Mjia0yC",
};

//fb example
const payload = {
  data: [
    {
      event_name: "Purchase",
      event_time: 1720980438,
      action_source: "website",
      user_data: {
        em: [
          "7b17fb0bd173f625b58636fb796407c22b3d16fc78302d79f0fd30c2fc2fc068",
        ],
        ph: [null],
      },
      custom_data: {
        currency: "USD",
        value: "142.52",
      },
    },
  ],
};

const purchasePayload1 = {
  data: [
    {
      action_source: "website",
      event_name: "Purchase",
      event_time: 1720981164,
      custom_data: { currency: "USD", value: 142.52 },
      user_data: {
        em: [
          "7b17fb0bd173f625b58636fb796407c22b3d16fc78302d79f0fd30c2fc2fc068",
        ],
        ph: [],
        fbc: "fb.1.1558723201720.abcde",
        fbp: "fb.1.1558571054390.1098115397",
        external_id: [
          "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5",
        ],
        country: [],
      },
    },
  ],
};

const purchasePayload = {
  data: [
    {
      event_name: "Purchase",
      event_time: 1720981164,
      action_source: "website",
      user_data: {
        em: [
          "7b17fb0bd173f625b58636fb796407c22b3d16fc78302d79f0fd30c2fc2fc068",
        ],
        ph: [null],
        fbc: "fb.1.1558723201720.abcde",
        fbp: "fb.1.1558571054390.1098115397",
        external_id: [
          "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5",
        ],
        country: [null],
      },
      custom_data: {
        currency: "USD",
        value: "142.52",
      },
    },
  ],
};

//set marketers link inside app

// office

//AASA file path//https://www.dmtgames.pro/.well-known/apple-app-site-association
//associated domain: applinks:www.dmtgames.pro
//Step2: automtically by apple
// automatic download link for AASA file done by apple from the associated domain list created in xcode only after the app has been installed on the device
app.get("/.well-known/apple-app-site-association", (req, res) => {
  // Serve the AASA file
  // default part if no query params
  // Set the appropriate Content-Type header
  res.setHeader("Content-Type", "application/json");
  res.sendFile(__dirname + "/apple-app-site-association.json");
});

//step3: on app launch
// call this on initializing app to fetch back the original link that is needed for tracking user
// because in the associated domain, we may not have th full path, but only the root domain https://www.dmtgames.pro

app.get("/track_app_installs", async (req, res) => {
  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "";
  const { advertiser_tracking_id } = req.query;

  if (advertiser_tracking_id) {
    console.log({ advertiser_tracking_id });
  }

  const userExists = await User.findOne({ ipAddress: ip });

  //save advertiser_tracking_id to user database on first app launch
  if (userExists && !userExists.advertiserTrackingId) {
    userExists.advertiserTrackingId =
      advertiser_tracking_id || userExists.advertiserTrackingId;

    const updatedUser = await userExists.save();

    if (updatedUser) {
      console.log({ "User updated": updatedUser });
    }
  }
  console.log("checking installs");
  await createFacebookAppInstallEvent();
});

// fetch all users
app.get("/all_users", async (req, res) => {
  const allUsers = await User.find();

  if (allUsers) {
    console.log({ allUsers });
    res.status(200).json(allUsers);
  }
});

//=================={temporary usage}======================
app.get("/installed", async (req, res) => {
  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "";

  const userExists = await User.findOne({ ipAddress: ip });

  // if only advertiser tracking id exists
  if (userExists) {
    console.log("only ip exists");
    const facebookLink = userExists.userLink;
    console.log({ installedLink: facebookLink });
    // res.redirect(newLink);
    res.json(facebookLink);
  }
});

async function createFacebookAppInstallEvent() {
  //Install: fb_mobile_install

  const url = `https://graph.facebook.com/${app_id}/activities?access_token=${app_access_token}`;

  const payload = {
    event: "CUSTOM_APP_EVENTS",
    advertiser_tracking_enabled: 1,
    application_tracking_enabled: 1,
    custom_events: [
      {
        _eventName: "fb_mobile_install",
      },
    ],
    skadnetwork_attribution: {
      version: "2.2",
      source_app_id: app_id,
      conversion_value: 0, // Значение для установки приложения
    },
    user_data: {
      anon_id: "UNIQUE_USER_ID",
    },
  };

  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(url, payload, { headers: headers });

    if (response.data) {
      let result = response.data;

      console.log({ result });
      //{ result: { success: true } }
    }
    //====={New update}========================
  } catch (error) {
    // const err = error.response.data;
    console.log(error);
    console.error(error);
    // return { status: err.success, message: err.message };
    // res.json(err);
  }
}

//fbp and token
//token

//keitaro postback
//  "https://www.wingsofflimits.pro/create_facebook_purchase_event?fbclid={fbclid}&sub_id_10={_sub_id_10}&external_id={subid}&date={date:U}&client_ip_address={_ip}";
//  "http://localhost:4000/create_facebook_purchase_event?fbclid={fbclid}&sub_id_10={_sub_id_10}&external_id={subid}&date={date:U}&client_ip_address={_ip}";
//  "http://localhost:4000/create_facebook_purchase_event?fbclid=user123&sub_id_10=abcdefg&external_id=user123&date={date:U}&client_ip_address={_ip}";

/**
 * 
 //keitaro postback without date and client_ip_address
//  "https://www.wingsofflimits.pro/create_facebook_purchase_event?fbclid={fbclid}&sub_id_10={_sub_id_10}&external_id={subid}&client_ip_address={_ip}";
//  "http://localhost:4000/create_facebook_purchase_event?fbclid={fbclid}&sub_id_10={_sub_id_10}&external_id={subid}&client_ip_address={_ip}";
//  "http://localhost:4000/create_facebook_purchase_event?fbclid=user123&sub_id_10=abcdefg&external_id=user123&client_ip_address={_ip}";
//https://www.wingsofflimits.pro/create_facebook_purchase_event?fbclid=user123&sub_id_10=abcdefg&external_id=user123
 */

//https://www.wingsofflimits.pro/create_facebook_purchase_event?fbclid={subid}&external_id={subid}&campaign_name={campaign_name}&campaign_id={campaign_id}&=true&visitor_code={visitor_code}&user_agent={user_agent}&ip={ip}&offer_id={offer_id}&os={os}&region={region}&city={city}&source={source}
//http://localhost:4000/create_facebook_purchase_event?fbclid=user123&sub_id_10=abcdefg&external_id=user123
//

//====={server}===========================================
const server = app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    server;
  })
  .catch((err) => console.log(err));
