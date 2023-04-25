import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs"
import bcrypt from "bcrypt";
import { v4 as uuid } from 'uuid';

const server = express();

server.use(cors());
server.use(express.json());
dotenv.config();

let db;
const mongoClient = new MongoClient(process.env.DATABASE_URL);

mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message));

server.post('/cadastro', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body; 

    const userSchema = joi.object({
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().min(3).required(),
        confirmPassword: joi.string().min(3).required()
    });
    if(password !== confirmPassword){
        return res.status(422).send("Password and confirm password is different");
    }
    const validation = userSchema.validate(req.body,{ abortEarly: false });
    if (validation.error) {
        return res.status(422).send(validation.error.details.map(detail => detail.message));
    }

    try{
        const validateEmail = await db.collection('users').findOne({ email: email });
        if(validateEmail){
            return res.status(409).send("This email is already registered");
        }
        const passwordHash = await bcrypt.hashSync(password, 10);

        const userCadastro = {
            name: name,
            email: email,
            password: passwordHash
        };

        await db.collection('users').insertOne(userCadastro);
        res.sendStatus(201);
    }catch (err){
        res.sendStatus(500);
    }
});

server.post("/", async (req, res) => {
    const { email, password } = req.body;
    const userSchema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
    }); 
    console.log(req.body)
    const validation = userSchema.validate(req.body,{ abortEarly: false });
    if (validation.error) {
        return res.status(422).send(validation.error.details.map(detail => detail.message));
    }
    try{
        const user = await db.collection("users").findOne({ email: email });
        if(!user){
            return res.status(404).send("Email not found or there is no account");
        }
        if(!bcrypt.compareSync(password, user.password)){
            res.status(401).send("Wrong password");
        }   
        const token = uuid();
        await db.collection('sessions').insertOne({ token, userId: user._id });                                                     
        res.status(200).send(token);                        
    }catch (err) {
        res.sendStatus(500);
    }
});

server.post("/nova-transacao/:tipo", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');
    const type = req.params.tipo;
    const { value, description } = req.body;

    const typeSchema = joi.object({
        value: joi.number().precision(2).required(),
        description: joi.string().required()
    });

    try{
        if(!token){
            return res.sendStatus(401);
        }
        const session = await db.collection('sessions').findOne({ token });
        if (!session) {
            return res.sendStatus(401)
        }
        const validation = typeSchema.validate(req.body, { abortEarly: false });
        if(validation.error){
            return res.status(422).send(validation.error.details.map(detail => detail.message));
        }
        if(type !== "entrada" && type !== "saida"){
            return res.status(404).send("pagina não existe");
        }
        const transaction = {
            userId: session.userId,
            value: value,
            description: description,
            type: type,
            day: dayjs().format('DD/MM') 
        }
        await db.collection('transactions').insertOne(transaction);   
        res.sendStatus(200);
    }catch(err){
        res.sendStatus(500);
    }


});

server.get("/home", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    try{
        if(!token){
            return res.sendStatus(401);
        }
        const session = await db.collection('sessions').findOne({ token });
        if (!session) {
            return res.sendStatus(401)
        }
        const transactions = await db.collection('transactions').find({userId: session.userId}).toArray();   
        const user = await db.collection('users').findOne({ _id: session.userId });
        res.send({transactions, userName: user.name});
    }catch(err){
        res.sendStatus(500);
    }

});
server.listen(5000);