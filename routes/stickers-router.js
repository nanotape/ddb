const express = require("express");
const validate = require("../validators/emst-search-validator");

const utils = require("../utils");
const getSticker = utils.db.getEntry("sticker");
const sendSingleSticker = utils.db.sendSingleEntry("sticker");
const createQuery = utils.db.createQuery;

let router = express.Router();

router.get("/", queryParser, loadStickers, respondStickers);
router.get("/:id", getSticker, sendSingleSticker);

async function queryParser(req, res, next)
{
    try{
        let data = await validate(req.query);
        let sql = "select id, name from stickers";
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

async function loadStickers(req, res, next)
{
    try{
        req.stickers = await req.app.locals.db.all(req.sql, req.sql_args);
        next();
    }
    catch(err){
        
        res.status(500).send();
    }
}

async function respondStickers(req, res, next)
{
    res.format({
        "application/json": () => {
            res.json(req.stickers);
        }
    });
}

module.exports = router;