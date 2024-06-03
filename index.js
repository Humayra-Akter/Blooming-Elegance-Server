require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const port = 5000;

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://blooming-elegance:6mJs5Ez8KDbDI3Vx@cluster0.guksi.mongodb.net/blooming-elegance?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const bloomingElegance = client.db("bloomingElegance");
    const flowersCollection = bloomingElegance.collection("flowersCollection");
    const userCollection = bloomingElegance.collection("userCollection");

    // product
    app.post("/flowers", async (req, res) => {
      const flowersData = req.body;
      const result = await flowersCollection.insertOne(flowersData);
      res.send(result);
    });

    app.get("/flowers", async (req, res) => {
      const flowersData = flowersCollection.find();
      const result = await flowersData.toArray();
      res.send(result);
    });

    app.get("/flowers/:id", async (req, res) => {
      const id = req.params.id;
      const flowersData = await flowersCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(flowersData);
    });

    app.patch("/flowers/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await flowersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    app.delete("/flowers/:id", async (req, res) => {
      const id = req.params.id;
      const result = await flowersCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.post("/user", async (req, res) => {
      const user = req.body;
      const isUserExist = await userCollection.findOne({ email: user?.email });
      if (isUserExist?._id) {
        return res.send({
          status: "success",
          message: "Login success",
        });
      }
      const result = await userCollection.insertOne(user);
      return res.send(result);
    });

    app.get("/user/get/:id", async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    });

    app.patch("/user/:email", async (req, res) => {
      const email = req.params.email;
      const userData = req.body;
      const result = await userCollection.updateOne(
        { email },
        { $set: userData },
        { upsert: true }
      );
      res.send(result);
    });

    console.log("Database is connected");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Route is connected");
});

app.listen(port, (req, res) => {
  console.log("App is listening on port :", port);
});
