const express = require("express");
const validate = require("../validators/attachment-search-validator");

const utils = require("../utils");
const getAttachment = utils.db.getEntry("attachment");
const sendSingleAttachment = utils.db.sendSingleEntry("attachment");
const createQuery = utils.db.createQuery;

let router = express.Router();

router.get("/", queryParser, loadAttachments, respondAttachments);
router.get("/:id", getAttachment, sendSingleAttachment);

async function queryParser(req, res, next)
{
    try{
        let data = await validate(req.query);
        let sql = "select id, filename from attachments";
        let result = createQuery(data, "id");
        sql += result[0];
        req.sql = sql;
        req.sql_args = result[1];
        next();
    }
    catch(err){
        res.status(400).send();
    }
}

async function loadAttachments(req, res, next)
{
    try{
        req.attachments = await req.app.locals.db.all(req.sql, req.sql_args);
        next();
    }
    catch(err){
        res.status(500).send();
    }
}

function respondAttachments(req, res, next)
{
    res.format({
        "application/json": () => {
            res.json(req.attachments);
        }
    });
}

module.exports = router;