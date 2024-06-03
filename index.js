require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createToken = (user) => {
  return jwt.sign({ email: user.email }, "secret", { expiresIn: "7d" });
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("Unauthorized access");
  const token = authHeader.split(" ")[1];
  try {
    const verified = jwt.verify(token, "secret");
    req.user = verified.email;
    next();
  } catch (error) {
    res.status(401).send("Unauthorized access");
  }
};

const isValidObjectId = (id) => {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
};

async function run() {
  try {
    await client.connect();
    const db = client.db("bloomingElegance");
    const flowersCollection = db.collection("flowersCollection");
    const userCollection = db.collection("userCollection");

    app.post("/flowers", verifyToken, async (req, res) => {
      const flowersData = req.body;
      const result = await flowersCollection.insertOne(flowersData);
      res.send(result);
    });

    app.get("/flowers", async (req, res) => {
      const flowersData = await flowersCollection.find().toArray();
      res.send(flowersData);
    });

    app.get("/flowers/:id", async (req, res) => {
      const id = req.params.id;
      if (!isValidObjectId(id)) {
        return res.status(400).send({ error: "Invalid ObjectId format" });
      }
      const flower = await flowersCollection.findOne({ _id: new ObjectId(id) });
      res.send(flower);
    });

    app.patch("/flowers/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      if (!isValidObjectId(id)) {
        return res.status(400).send({ error: "Invalid ObjectId format" });
      }
      const updatedData = req.body;
      const result = await flowersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    app.delete("/flowers/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      if (!isValidObjectId(id)) {
        return res.status(400).send({ error: "Invalid ObjectId format" });
      }
      const result = await flowersCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.post("/user", async (req, res) => {
      const user = req.body;
      const token = createToken(user);
      const isUserExist = await userCollection.findOne({ email: user.email });
      if (isUserExist) {
        return res.send({
          status: "success",
          message: "Login successful",
          token,
        });
      }
      await userCollection.insertOne(user);
      res.send({ token });
    });

    app.get("/user/get/:id", async (req, res) => {
      const id = req.params.id;
      if (!isValidObjectId(id)) {
        return res.status(400).send({ error: "Invalid ObjectId format" });
      }
      const user = await userCollection.findOne({ _id: new ObjectId(id) });
      res.send(user);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      res.send(user);
    });

    app.patch("/user/:email", async (req, res) => {
      const email = req.params.email;
      const updatedData = req.body;
      const result = await userCollection.updateOne(
        { email },
        { $set: updatedData },
        { upsert: true }
      );
      res.send(result);
    });

    console.log("Connected to database");
  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("API is working");
});

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
