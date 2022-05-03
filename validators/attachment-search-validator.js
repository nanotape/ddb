const Ajv = require("ajv");
const ajv = new Ajv({coerceTypes: true, useDefaults: true, removeAdditional: true});
const otm = require("./otm-schema");

const schema = {
    $async: true,
    type: "object",
    properties: {
        id: otm,
        message_id: otm,
        filename: otm,
        filetype: otm,
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