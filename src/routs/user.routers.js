import { Router } from "express";
import { logOut, signIn, signUp } from "../controllers/userController.js";

const usersRouters = Router();

usersRouters.post('/cadastro', signUp);
usersRouters.post("/", signIn);
usersRouters.delete("/delete/:token", logOut);

export default usersRouters;