const express = require("express");
const validate = require("../validators/channel-search-validator");

const utils = require("../utils");
const getChannel = utils.db.getEntry("channel");
const sendSingleChannel = utils.db.sendSingleEntry("channel");
const createQuery = utils.db.createQuery;

let router = express.Router();

router.get("/", queryParser, loadChannels, respondChannels);
router.get("/:id", getChannel, sendSingleChannel);

async function queryParser(req, res, next)
{
    try{
        let data = await validate(req.query);
        let sql = "select id, name from channels";
        let result = createQuery(data, "name");
        sql += result[0];
        req.sql = sql;
        req.sql_args = result[1];
        next();
    }
    catch(err){
        res.status(400).send();
    }
}

async function loadChannels(req, res, next)
{
    try{
        req.channels = await req.app.locals.db.all(req.sql, req.sql_args);
        next();
    }
    catch(err){
        res.status(500).send();
    }
}

function respondChannels(req, res, next)
{
    res.format({
        "application/json": () => {
            res.json(req.channels);
        }
    });
}

module.exports = router;