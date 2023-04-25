import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import routers from "./routs/index.routers.js";

const server = express();

server.use(cors());
server.use(express.json());
server.use(routers);
dotenv.config();

export let db;
const mongoClient = new MongoClient(process.env.DATABASE_URL);

mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message));

server.listen(5000);