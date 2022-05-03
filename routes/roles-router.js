const express = require("express");
const validate = require("../validators/role-search-validator");
const offlimVal = require("../validators/offlim-validator");

const utils = require("../utils");
const getRole = utils.db.getEntry("role");
const sendSingleRole = utils.db.sendSingleEntry("role");
const createQuery = utils.db.createQuery;

let router = express.Router();

router.get("/", queryParser, loadRoles, respondRoles);
router.get("/:id", getRole, sendSingleRole);
router.get("/:id/users", loadRoleUsers, utils.db.sendData);

async function loadRoleUsers(req, res, next)
{
    try{
        let q = await offlimVal(req.query);
        let sql = "select id, username, discriminator from (select ua.user_id id, a.username username, a.discriminator discriminator, \
                   max(ua.last_used) from aliases as a inner join user_aliases as ua on a.id = ua.alias_id inner join user_roles as ur \
                   on ua.user_id = ur.user_id where ur.role_id = ? group by ur.user_id limit ? offset ?)";
        
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
        let sql = "select id, name from roles"
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

async function loadRoles(req, res, next)
{
    try{
        req.messages = await req.app.locals.db.all(req.sql, req.sql_args);
        next();
    }
    catch(err){
        
        res.status(500).send();
    }
}

function respondRoles(req, res, next)
{
    res.format({
        "application/json": () => {
            res.json(req.messages);
        }
    });
}

module.exports = router;