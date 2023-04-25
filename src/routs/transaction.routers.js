import { Router } from "express";
import { getTransactions, newTransactions } from "../controllers/transactionController.js";

const transactionsRouters = Router();

transactionsRouters.post("/nova-transacao/:tipo", newTransactions);
transactionsRouters.get("/home", getTransactions);

export default transactionsRouters;