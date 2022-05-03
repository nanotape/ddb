const express = require("express");
const validate = require("../validators/emst-search-validator");

const utils = require("../utils");
const getEmoji = utils.db.getEntry("custom_emoji");
const sendSingleEmoji = utils.db.sendSingleEntry("custom_emoji");
const createQuery = utils.db.createQuery;

let router = express.Router();

router.get("/", queryParser, loadEmojis, respondEmojis);
router.get("/:id", getEmoji, sendSingleEmoji);

async function queryParser(req, res, next)
{
    try{
        let data = await validate(req.query);
        let sql = "select id, name from custom_emojis";
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

async function loadEmojis(req, res, next)
{
    try{
        req.emojis = await req.app.locals.db.all(req.sql, req.sql_args);
        next();
    }
    catch(err){
        res.status(500).send();
    }
}

async function respondEmojis(req, res, next)
{
    res.format({
        "application/json": () => {
            res.json(req.emojis);
        }
    });
}

module.exports = router;