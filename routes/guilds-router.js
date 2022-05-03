const express = require("express");
const validate = require("../validators/guild-search-validator");
const offlimVal = require("../validators/offlim-validator");

const utils = require("../utils");
const getGuild = utils.db.getEntry("guild");
const sendSingleGuild = utils.db.sendSingleEntry("guild");
const createQuery = utils.db.createQuery;

let router = express.Router();

router.get("/", queryParser, loadGuilds, respondGuilds);
router.get("/:id", getGuild, sendSingleGuild);
router.get("/:id/users", loadGuildUsers, utils.db.sendData);

async function loadGuildUsers(req, res, next)
{
    try{
        let q = await offlimVal(req.query);
        let sql = "select id, username, discriminator from (select ua.user_id id, a.username username, a.discriminator discriminator, \
                   max(ua.last_used) from aliases as a inner join user_aliases as ua on a.id = ua.alias_id inner join messages as m on \
                   m.author_id = ua.user_id inner join channels as c on m.channel_id = c.id where c.guild_id = ? group by ua.user_id order by a.username limit ? offset ?)";
        
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
        let sql = "select id, name from guilds";
        let result = createQuery(data, "name desc");
        sql += result[0];
        
        req.sql = sql;
        req.sql_args = result[1];
        next();
    }
    catch(err){
        
        res.status(400).send();
    }
}

async function loadGuilds(req, res, next)
{
    try{
        req.guilds = await req.app.locals.db.all(req.sql, req.sql_args);
        next();
    }
    catch(err){
        
        res.status(500).send();
    }
}

function respondGuilds(req, res, next)
{
    res.format({
        "application/json": () => {
            res.json(req.guilds);
        }
    });
}

module.exports = router;