const express = require("express");
const validate = require("../validators/user-search-validator");
const offlimVal = require("../validators/offlim-validator");

const utils = require("../utils");
const getUser = utils.db.getEntry("user");
const sendSingleUser = utils.db.sendSingleEntry("user");
const createQuery = utils.db.createQuery;

let router = express.Router();

router.get("/", queryParser, loadUsers, respondUsers);
router.get("/:id", getUser, sendSingleUser);
router.get("/:id/guilds", loadUserGuilds, utils.db.sendData);
router.get("/:id/aliases", loadUserAliases, utils.db.sendData);
router.get("/:id/accounts", loadUserAccounts, utils.db.sendData);
router.get("/:id/guilds/:gid/roles", loadUserRoles, utils.db.sendData);

/*
    Function: loadUserRoles
    Purpose:  Retrieve an array of all the roles that a user has
*/
async function loadUserRoles(req, res, next)
{
    
    try{
        let q = await offlimVal(req.query);
        let sql = "select r.id, r.name from roles as r inner join user_roles as ur on r.id = ur.role_id \
                   where ur.user_id = ? and r.guild_id = ? limit ? offset ?";
        
        res.data = await req.app.locals.db.all(sql, [req.params.id, req.params.gid, q.limit, q.offset]);
        next();
    }
    catch(err){
        
        res.status(500).send();
    }
}

/*
    Function: loadUserGuilds
    Purpose:  Retrieve an array of all the guilds that a user has sent messages in
*/
async function loadUserGuilds(req, res, next)
{
    try{
        let q = await offlimVal(req.query);
        let sql = "select id, name from guilds where owner_id = ? union select distinct g.id, g.name from guilds as g inner join channels as c on g.id = c.guild_id inner join messages as m on c.id = m.channel_id where m.author_id = ? limit ? offset ?";
        
        res.data = await req.app.locals.db.all(sql, [req.params.id, req.params.id, q.limit, q.offset]);
        next();
    }
    catch(err){
        
        res.status(500).send("pages/500");
    }
}

async function loadUserAliases(req, res, next)
{
    try{
        let q = await offlimVal(req.query);
        let sql = "select a.id, a.username, a.discriminator, ua.last_used from aliases as a inner join user_aliases as ua on a.id = ua.alias_id where ua.user_id = ? order by ua.last_used desc limit ? offset ?";
        
        res.data = await req.app.locals.db.all(sql, [req.params.id, q.limit, q.offset]);
        next();
    }
    catch(err){
        
        res.status(500).send("pages/500");
    }
}

async function loadUserAccounts(req, res, next)
{
    try{
        let q = await offlimVal(req.query);
        let sql = "select * from connected_accounts where user_id = ? limit ? offset ?";
        
        res.data = await req.app.locals.db.all(sql, [req.params.id, q.limit, q.offset]);
        next();
    }
    catch(err){
        
        res.status(500).send("pages/500");
    }
}

async function queryParser(req, res, next)
{
    try{
        let data = await validate(req.query);
        let sql = "select u.id id, a.username username, a.discriminator discriminator from users as u inner join user_aliases as ua on u.id = ua.user_id inner join aliases as a on ua.alias_id = a.id";
        let result = createQuery(
            data,
            "a.username, a.discriminator, ua.last_used desc",
            {
                id: "u",
                username: "a",
                discriminator: "a"
            });
        sql += result[0];
        
        req.sql = sql;
        req.sql_args = result[1];
        next();
    }
    catch(err){
        
        res.status(400).send();
    }
}

async function loadUsers(req, res, next)
{
    try{
        req.users = await req.app.locals.db.all(req.sql, req.sql_args);
        next();
    }
    catch(err){
        
        res.status(500).send();
    }
}

function respondUsers(req, res, next)
{
    res.format({
        "application/json": () => {
            res.json(req.users);
        }
    });
}

module.exports = router;