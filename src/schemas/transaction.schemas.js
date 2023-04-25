import joi from "joi";

export const typeSchema = joi.object({
    value: joi.number().precision(2).required(),
    description: joi.string().required()
});