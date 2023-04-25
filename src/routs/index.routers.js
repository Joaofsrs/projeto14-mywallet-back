import { Router } from "express";
import transactionsRouters from "./transaction.routers.js";
import usersRouters from "./user.routers.js";

const routers = Router();

routers.use(transactionsRouters);
routers.use(usersRouters);

export default routers;