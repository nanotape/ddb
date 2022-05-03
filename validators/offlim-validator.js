const Ajv = require("ajv");
const ajv = new Ajv({coerceTypes: true, useDefaults: true, removeAdditional: true});

const schema = {
    $async: true,
    additionalProperties: false,
    type: "object",
    properties: {
        limit: {
            type: "integer",
            maximum: 50,
            minimum: 0,
            default: 50
        },
        offset: {
            type: "integer",
            default: 0
        }
    }
};

module.exports = ajv.compile(schema);