import joi from "joi";
import dayjs from "dayjs";
import { db } from "../app.js";
import { typeSchema } from "../schemas/transaction.schemas.js"

export async function newTransactions(req, res) {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');
    const type = req.params.tipo;
    const { value, description } = req.body;

    try {
        if (!token) {
            return res.sendStatus(401);
        }
        const session = await db.collection('sessions').findOne({ token });
        if (!session) {
            return res.sendStatus(401)
        }
        const validation = typeSchema.validate(req.body, { abortEarly: false });
        if (validation.error) {
            return res.status(422).send(validation.error.details.map(detail => detail.message));
        }
        if (type !== "entrada" && type !== "saida") {
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
    } catch (err) {
        res.sendStatus(500);
    }


}

export async function getTransactions(req, res) {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    try {
        if (!token) {
            return res.sendStatus(401);
        }
        const session = await db.collection('sessions').findOne({ token });
        if (!session) {
            return res.sendStatus(401)
        }
        const transactions = await db.collection('transactions').find({ userId: session.userId }).toArray();
        const user = await db.collection('users').findOne({ _id: session.userId });
        res.send({ transactions, userName: user.name });
    } catch (err) {
        res.sendStatus(500);
    }

}