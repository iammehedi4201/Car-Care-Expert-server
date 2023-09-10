const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;

//middleware
app.use(cors()); //for sending data from server to client
app.use(express.json()); //for converting req.body data into json data

const uri = process.env.MONGO_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//verify Jwt
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  //check if authorization avaiable
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "This is Optimus Prime .you are under Arrest for  unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, (error, decoded) => {
    //check if token is vailded or expiery date
    if (error) {
      return res
        .status(403)
        .send({ error: true, message: "unauthorized access" });
    }
    //decode means that decode it and get the information and add the infomation to the (req) method
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //create Database
    const serviceCollection = client
      .db("Car-Care-Expert")
      .collection("services");
    const bookingCollection = client
      .db("Car-Care-Expert")
      .collection("Bookings");

    //----------------JWT Api-------------------//

    //jwt create token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    //----------------service Api-------------------//

    //Read Services
    app.get("/services", async (req, res) => {
      const services = await serviceCollection.find().toArray();
      res.send(services);
    });

    //Read a Indivisul Service
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      // const options = {
      // Include only the `title` and `imdb` fields in the returned document and 1 means it will to document and 0 means it will not add to document.it will give _id as a default parameter
      //   projection: { title: 1, price: 1, description: 1, img: 1 },
      // };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    //---------------- Booking Api -------------------//
                      
    //Read some Booking Data
    app.get("/bookings", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      //this is for check the decoded vs and query email 
      if (decoded.email !== req.query.email) {
         return res.status(403).send({error : true, message :"you have no right to access other data "})
      }
      console.log("Optimus came from cyberton",decoded );
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });

    //insert Booking Data
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    //Delete Booking
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    //Update Booking
    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      const updateDoc = {
        $set: {
          status: body.status,
        },
      };
      const result = await bookingCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
