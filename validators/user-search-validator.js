const Ajv = require("ajv");
const ajv = new Ajv({coerceTypes: true, useDefaults: true, removeAdditional: true});
const otm = require("./otm-schema");

const schema = {
    $async: true,
    additionalProperties: false,
    type: "object",
    properties: {
        id: otm,
        username: otm,
        discriminator: otm,
        limit: {
            type: "integer",
            maximum: 50,
            minimum: 0,
            default: 50,
        },
        bot: {
            type: ["boolean", "null"],
            default: null
        },
        offset: {
            type: "integer",
            default: 0
        }
    }
};

module.exports = ajv.compile(schema);