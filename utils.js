const fs = require("fs");
const uuid = require("uuid");
const path = require("path");
const Database = require("sqlite-async");
const constants = require("./constants");
const errors = require("./errors");

const {
    INTENTS,
    EVENTS
} = constants;

const {
    ERR_INVALID_EVENT,
    ERR_INVALID_INTENT
} = errors;

/*
    Function: parseSchema
    Purpose:  Remove all newlines in an sql file so that the sqlite3 module can interpret it
    return:   The parsed sql commands
*/
function parseSchema(schema)
{
    return schema.replace(/\n/g, "");
}

/*
    Function: createDB
    Purpose:
    in:
    in:
    in:
    return:
*/
async function createDB({db_path, db_schemas_path, overwrite=false})
{
    return new Promise((res, rej) => {
        let tables = [];
        if(overwrite){
            if(fs.existsSync(db_path)){
                fs.rmSync(db_path);
            }
        }

        Database.open(db_path).then((db) => {
            fs.readdir(db_schemas_path, (err, files) => {
                if(err) rej(err);

                for(let file of files){
                    tables.push(file.replace(/.sql$/g, ""));
                    fs.readFile(path.join(db_schemas_path, file), encoding="utf-8", (err, schema) => {
                        if(err) rej(err);
                        
                        db.exec(parseSchema(schema), (err) => {
                            if(err) rej(err);
                        });
                    });
                }
                res({
                    db: db,
                    tables: tables
                });
            });
        });
    });
}

/*
    Function: getCount
    Purpose:  Get the number of rows in a specific table
    in:       The database object
    in:       The name of the table
    return:   The number of rows
*/
async function getCount(db, table)
{
    return (await db.get(`select count(*) count from ${table}`)).count;
}

/*
    Function: createQuery
    Purpose:  Based on an object of attributes, creates a segment of a query which would come after
              the where clause and an array of the arguments in the order they appear in the query. (to be passed into async-sqlite)

            e.g.
            {id: [1,2], after: 2018-10, limit: 50, offset: 0} 
            becomes
            [
            "(id like ? escape '\' or id like ? escape '\') and timestamp > ? offset ? limit ?",
            ['1', '2', '2018-10', 0, 50] 
            ]

    in:       The object of attributes to be turned into the query segment
    in:       A string representing which attribute selected by the query should be used to order it
    in:       Prefixes that should be used by certain query attributes being parsed if there are joins in the intended query
    return:   An array taking a similar format to the example as described above
*/
function createQuery(attr, order_by=null, prefixes=null)
{
    let sql = "";
    let args = [];
    let entries = Object.entries(attr);
    for(let i=0; i<entries.length; ++i){
        let key = entries[i][0];
        let val = entries[i][1];

        if(key !== "limit" && key !== "offset"){
            if(val === null)
                continue;
            
            if(prefixes !== null && prefixes.hasOwnProperty(key))
                key = `${prefixes[key]}.${key}`;
            
            if(Array.isArray(val)){
                if(i > 0)
                    sql += " and "
                sql += "(";
                for(let j=0; j<val.length; ++j){
                    sql += `${key} like ?`;
                    if(j < val.length-1){
                        sql += " or ";
                    }
                }
                sql += ")";
            }
            else{
                if(i > 0)
                    sql += " and ";

                switch(key){
                    case "after":
                        sql += "timestamp > ?";
                        break;
                    
                    case "before":
                        sql += "timestamp < ?";
                        break;

                    default:
                        sql += `${key} like ? escape '\\'`;
                        break;
                }
            }

            args = args.concat(val);
        }
    }

    args.push(attr.limit, attr.offset); //assumes limit and offset are present within every attributes object
    if(order_by !== null)
        sql += ` order by ${order_by}`;
        
    sql += " limit ? offset ?";
    if(args.length > 2)
        sql = " where " + sql;

    return [sql, args];
}

/*
    Function: validateIntent
    Purpose:
    in:
    throws:
*/
function validateIntent(intent)
{ 
    if(!INTENTS.hasOwnProperty(intent)){
        throw new ERR_INVALID_INTENT(intent);
    }
}

/*
    Function: validateEvent
    Purpose:
    in:
    throws:
*/
function validateEvent(event)
{
    if(!EVENTS.hasOwnProperty(event)){
        throw new ERR_INVALID_EVENT(event);
    }
}

/*
    Function: getEventIntent
    Purpose:  Get the name of the intent that an event falls under
    return:   A string containing the name of the intent the event falls under.
              If the event doesn't exist, return null
*/
function getEventIntent(event)
{
    try{
        validateEvent(event);
        for(const i in INTENTS){
            if(i.e.hasOwnProperty(event)) return i;
        }
    }
    catch(err){
        return null;
    }
}

/*
    Function: sleep
    Purpose:  Make the program halt for a certain amount of time
    in:       The number of milliseconds the program should sleep for
*/
async function sleep(millis)
{
    if(millis < 0) millis = 0;
    return new Promise((res) => {
        setTimeout(res, millis);
    });
}

/*
    Function: createIntentSignature
    Purpose:
    in:
    return:
    throws:
*/
function createIntentSignature(intents)
{
    let r = 0;
    for(const i in intents){
        validateIntent(intents[i]);
        r |= (1 << INTENTS[intents[i]].b);
    }
    return r;
}

/*
    Function: createNonce
    Purpose:  Create a pseudo-unique 32 byte string
    return:
*/
function createNonce()
{
    return uuid.v4().replace(/-/g, "");
}

/*
    Function: capitalize
    Purpose:  Capitalize the first character of a string
*/
function capitalize(text)
{
    return text.replace(/^./g, (c) => c.toUpperCase());
}

/*
    Function: getEntry
    Purpose:  Heresy
    in:       The singular name of the entity type being stored in the table
    return:
*/
function getEntry(name)
{
    return (req, res, next) => {
        req.app.locals.db.get(`select * from ${name}s where id = ?`, req.params.id).then((row) => {
            if(typeof row !== "undefined"){
                req[name] = row;
                next();
            }
            else{
                res.status(404).render("pages/404", {msg: `${capitalize(name)} not found`});
            }
        }).catch(() => {
            res.status(500).render("pages/500");
        });
    }
}

/*
    Function: sendSingleEntry
    Purpose:  Heresy
    in:       The singular name of the entity type being stored in the table
    return:
*/
function sendSingleEntry(name)
{
    return (req, res, next) => {
        res.format({
            "application/json": () => {
                res.json(req[name]);
            },
            "text/html": () => {
                let obj = {};
                obj[name] = req[name];
                res.render(`pages/${name}`, obj);
            }
        });
    }
}

function sendData(req, res, next)
{
    res.format({
        "application/json": () => {
            res.json(res.data);
        }
    });
}

module.exports = {
    gateway: {
        validateIntent,
        validateEvent,
        createIntentSignature,
        getEventIntent
    },
    general: {
        sleep,
        createNonce,
        capitalize
    },
    db: {
        getEntry,
        sendSingleEntry,
        createDB,
        parseSchema,
        getCount,
        createQuery,
        sendData
    }
};