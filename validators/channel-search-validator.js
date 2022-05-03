const Ajv = require("ajv");
const ajv = new Ajv({coerceTypes: true, useDefaults: true, removeAdditional: true});
const otm = require("./otm-schema");

const channel_type_schema = {
    type: ["integer", "null"],
    maximum: 13,
    minimum: 0,
    default: null
};

const schema = {
    $async: true,
    additionalProperties: false,
    type: "object",
    properties: {
        id: otm,
        name: otm,
        guild_id: otm,
        type: {
            anyOf: [
                channel_type_schema,
                {
                    type: "array",
                    items: channel_type_schema,
                    minItems: 2
                }
            ]
        },
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