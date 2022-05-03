const express = require("express");
const DiscordRestClient = require("./rest-client");
const conf = require("./conf.json");
const dbUtils = require("./utils").db;

const app = express();

app.set("view engine", "pug");
app.use(express.static("public"));


let apiRouter = require("./routes/api-router");
app.use("/", apiRouter);

app.get("/", async (req, res, next) => {
    let rows = [];
    for(let t of app.locals.tables){
        rows.push([t, await dbUtils.getCount(app.locals.db, t)]);
    }
    rows.sort((a, b) =>
     {
        return b[1] - a[1];
    });

    res.render("pages/index", {rows: rows});
});

app.get("/search", (req, res, next) => {
    res.render("pages/search");
});

app.get("/search/help", (req, res, next) => {
    res.render("pages/search-help");
});

app.get("/control", (req, res, next) => {
    res.render("pages/control");
});

// NOTE // Due to ratelimiting on Discord's part, and the fact that this program only makes use
//      // of one account, only one channel may have its messages scraped at a time
app.locals.scrape_status = {
    guild_id: null,
    channel_id: null,
    skip_channel: false,
    scraping: false
};

dbUtils.createDB(conf).then((resp) => {
    console.log("Database created successfully");
    let {db, tables} = resp;
    app.locals.db = db;
    app.locals.conf = conf;
    app.locals.tables = tables;

    db.run("pragma foreign_keys=true").then(() => {
        let restClient = new DiscordRestClient(conf);
        restClient.getClientGuilds().then(g => {
            app.locals.client_guilds = g;
        });
        app.locals.restClient = restClient;
    
        app.listen(conf.port);
        console.log(`Server listening on 127.0.0.1:${conf.port}`);
    });
});
