const express = require("express");
const validate = require("../validators/message-search-validator");
const offlimVal = require("../validators/offlim-validator");

const utils = require("../utils");
const getMessage = utils.db.getEntry("message");
const sendSingleMessage = utils.db.sendSingleEntry("message");
const createQuery = utils.db.createQuery;

let router = express.Router();

router.get("/", queryParser, loadMessages, respondMessages);
router.get("/:id", getMessage, sendSingleMessage);
router.get("/:id/users", loadUserMentions, utils.db.sendData);
router.get("/:id/roles", loadRoleMentions, utils.db.sendData);
router.get("/:id/stickers", loadStickers, utils.db.sendData);

async function loadUserMentions(req, res, next)
{
    try{
        let q = await offlimVal(req.query);
        let sql = "select id, username, discriminator from (select ua.user_id id, a.username username, a.discriminator discriminator, \
                   max(ua.last_used) from aliases as a inner join user_aliases as ua on a.id = ua.alias_id inner join user_mentions as um on \
                   um.user_id = ua.user_id where um.message_id = ? limit ? offset ?)";
        
        res.data = await req.app.locals.db.all(sql, [req.params.id, q.limit, q.offset]);
        next();
    }
    catch(err){
        res.status(500).send();
    }
}

async function loadRoleMentions(req, res, next)
{
    try{
        let q = await offlimVal(req.query);
        let sql = "select r.id, r.name from roles as r inner join role_mentions as rm on r.id = rm.role_id where \
                rm.message_id = ? limit ? offset ?";
        res.data = await req.app.locals.db.all(sql, [req.params.id, q.limit, q.offset]);
        next();
    }
    catch(err){
        res.status(500).send();
    }
}

async function loadStickers(req, res, next)
{
    try{
        let q = await offlimVal(req.query);
        let sql = "select s.id, s.name from stickers as s inner join message_stickers as ms on s.id = ms.sticker_id \
                where ms.message_id = ? limit ? offset ?";
        res.data = await req.app.locals.db.all(sql, [req.params.id, q.limit, q.offset]);
        next();
    }
    catch(err){
        res.status(500).send();
    }
}

async function queryParser(req, res, next)
{
    try{
        let data = await validate(req.query);
        let sql = "select id, content, timestamp from messages";
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

async function loadMessages(req, res, next)
{
    try{
        req.messages = await req.app.locals.db.all(req.sql, req.sql_args);
        next();
    }
    catch(err){
        res.status(500).send();
    }
}

function respondMessages(req, res, next)
{
    res.format({
        "application/json": () => {
            res.json(req.messages);
        }
    });
}

module.exports = router;