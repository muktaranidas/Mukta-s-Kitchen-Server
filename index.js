const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");

const {
  MongoClient,
  ServerApiVersion,
  OrderedBulkOperation,
} = require("mongodb");
const { ObjectID } = require("bson");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tdieq2y.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  // console.log(req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const serviceCollection = client.db("mykitchen").collection("services");
    const reviewCollection = client.db("mykitchen").collection("reviews");

    //jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    // read
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.limit(6).toArray();
      res.send(services);
    });
    // app.post("/services", verifyJWT, async (req, res) => {
    //   const service = req.body;
    //   const result = await reviewCollection.insertOne(service);
    //   res.send(result);
    // });
    app.post("/servicesAll", async (req, res) => {
      const newService = req.body;
      // console.log(newService);
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    //read all
    app.get("/servicesAll", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    //read
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectID(id) };
      // find karon id holo uniqe
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // reviews api
    app.get("/reviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      // console.log("Inside Reviews Api", decoded);
      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "UnAuthorized Access" });
      }
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    app.post("/reviews", verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    // update
    app.patch("/reviews/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const query = { _id: ObjectID(id) };
      const updatedDoc = {
        $set: {
          status: status,
        },
      };
      const result = await reviewCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    //delete
    app.delete("/reviews/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectID(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("My Kitchen server is running");
});

app.listen(port, () => {
  console.log(`My Kitchen server running on ${port}`);
});
