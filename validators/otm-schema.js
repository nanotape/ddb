const schema = {
    anyOf: [
        {type: ["string", "null"]},
        {
            type: "array",
            items: {type: "string"},
            minItems: 2
        }
    ],
    default: null
};

module.exports = schema;