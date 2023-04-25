import bcrypt from "bcrypt";
import { v4 as uuid } from 'uuid';
import { db } from "../app.js";
import { signInSchema, signUpSchema } from "../schemas/user.schemas.js";

export async function signUp(req, res) {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(422).send("Password and confirm password is different");
    }
    const validation = signUpSchema.validate(req.body, { abortEarly: false });
    if (validation.error) {
        return res.status(422).send(validation.error.details.map(detail => detail.message));
    }

    try {
        const validateEmail = await db.collection('users').findOne({ email: email });
        if (validateEmail) {
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
    } catch (err) {
        res.sendStatus(500);
    }
}

export async function signIn(req, res) {
    const { email, password } = req.body;

    const validation = signInSchema.validate(req.body, { abortEarly: false });
    if (validation.error) {
        return res.status(422).send(validation.error.details.map(detail => detail.message));
    }
    try {
        const user = await db.collection("users").findOne({ email: email });
        if (!user) {
            return res.status(404).send("Email not found or there is no account");
        }
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).send("Wrong password");
        }
        const token = uuid();
        await db.collection('sessions').insertOne({ token, userId: user._id });
        res.status(200).send(token);
    } catch (err) {
        res.sendStatus(500);
    }
}

export async function logOut(req, res) {
    const { token } = req.params;
    try {
        const result = await db.collection("sessions").deleteOne({ token })
        if (result.deletedCount === 0) return res.sendStatus(404);

        res.send("Object deleted");
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
}