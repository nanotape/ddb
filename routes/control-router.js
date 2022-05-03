const {
    CHANNEL_TYPES
} = require("../constants");

const TEXT_CHANNELS = new Set([
    CHANNEL_TYPES.GUILD_TEXT,
    CHANNEL_TYPES.GUILD_NEWS,
    CHANNEL_TYPES.GUILD_NEWS_THREAD,
    CHANNEL_TYPES.GUILD_PUBLIC_THREAD,
    CHANNEL_TYPES.GUILD_PRIVATE_THREAD
]);

const {
    ERR_INTERNAL_SERVER_500
} = require("../errors");

const express = require("express");

let router = express.Router();

router.get("/", getGuilds, loadPanel);
router.get("/update", updateGuilds, getGuilds, loadPanel);
router.get("/skip", skipChannel);
router.get("/stop", stopScrape);
router.get("/:id", verifyGuild, scrape);

function skipChannel(req, res, next)
{
    if(req.app.locals.scrape_status.scraping){
        req.app.locals.scrape_status.skip_channel = true;
    }
    res.status(200).send("something");
}

function stopScrape(req, res, next)
{
    req.app.locals.scrape_status.scraping = false;
    req.app.locals.scrape_status.channel_id = null;
    req.app.locals.scrape_status.guild_id = null;
    res.status(200).send();
}

/*
    Function: updateGuilds
    Purpose:  Retrieve the guilds that the account is a member of and cache their information
*/
async function updateGuilds(req, res, next)
{
    req.app.locals.client_guilds = await req.app.locals.restClient.getClientGuilds();
    next();
}

/*
    Function: getGuilds
    Purpose:  Retrieve information from the database about the cached guilds that the account
              is a member of for the control panel interface to render when loaded
*/
async function getGuilds(req, res, next)
{
    req.guilds = req.app.locals.client_guilds;
    for(let g of req.guilds){
        let last_scraped = await req.app.locals.db.get("select last_scraped from guilds where id = ?", [g.id]);
        if(typeof last_scraped === "undefined"){
            g.last_scraped = "Never";
        }
        else{
            g.last_scraped = last_scraped.last_scraped;
        }
    }
    next();
}

/*
    Function: loadPanel
    Purpose:  Render the control interface and send it off to the user
*/
function loadPanel(req, res, next)
{
    res.render("pages/control", {
        guilds: req.guilds,
        status: req.app.locals.scrape_status
    });
}

/*
    Function: insertUserAccounts
    Purpose:  Take an array of user account objects and insert them into the database
    in:       The database object
    in:       The user ID that the accounts are linked to
    in:       The array of user account objects
*/
async function insertUserAccounts(db, user_id, user_accounts)
{
    for(let a of user_accounts){
        await db.run("insert or ignore into connected_accounts values (?, ?, ?, ?, ?)", 
        [user_id, a.type, a.id, a.name, a.verified]
        );
    }
}

/*
    Function: inserUserRoles
    Purpose:  Take a user and the roles that have been attributed to them and insert the roles and their relations
              to the user
    in:       The database object
    in:       The Discord rest client
    in:       The guild ID that the roles are from
    in:       The ID of the user which has the roles
    in:       An array of role objects attribute to the specified user ID
*/
async function insertUserRoles(db, client, guild_id, user_id, roles)
{
    for(let r of roles){
        //since new roles can be added as we are scraping, this checks if the role exists first to prevent an error
        //If it doesn't exist, a new guild object is requested and the roles for it are upseted into the database
        if(!(await db.get("select exists(select * from roles where id = ?) as e").e)){
            let new_roles = (await client.getGuild(guild_id)).roles;
            for(let nr of new_roles){
                await upsertRole(db, nr, guild_id);
            }
        }
        await db.run("insert or ignore into user_roles values (?, ?)", [user_id, r]);
    }
}

/*
    Function: insertUser
    Purpose:  Insert a user into the database
    in:       The database object
    in:       The ID of the user
    in:       A boolean representing whether the user is a bot or not
*/
async function insertUser(db, user_id, bot)
{
    if(typeof bot !== "boolean")
        bot = false;
    
    await db.run("insert or ignore into users values (?, ?)", [user_id, bot]);
}

/*
    Function: insertAlias
    Purpose:  Insert an alias into the database
    in:       The db object
    in:       The alias username
    in:       The alias discriminator
    return:   The row ID of the alias after it's been inserted
*/
async function insertAlias(db, username, discriminator)
{
    await db.get("insert or ignore into aliases (username, discriminator) values (?, ?)", 
    [username, discriminator]);
    
    return (await db.get("select id from aliases where username = ? and discriminator = ?",
    [username, discriminator])).id;
}

/*
    Function: upsertAliasRelation
    Purpose:  Insert a relation between a user and alias which both already exist in the database.
              If the relation already exists, update the time of which the user was last seen using that alias
    in:       The database object
    in:       The user ID
    in:       The alias ID
*/
async function upsertAliasRelation(db, user_id, alias_id)
{
    await db.run("insert into user_aliases values (?, ?, (select datetime())) on conflict(user_id, alias_id) do update set last_used = (select datetime())",
    [user_id, alias_id]);
}

/*
    Function: upsertEmoji
    Purpose:  Insert an emoji into the database. If the emoji already exists update its name just in case it's changed in the time it was
              last recorded
    in:       The database object
    in:       The emoji object
    in:       The ID of the guild the emoji is from
*/
async function upsertEmoji(db, data, guild_id=null)
{
    await db.run("insert into custom_emojis values ($id, $guild, $name) on conflict (id) do update set name = $name",
    {
        $id: data.id,
        $name: data.name,
        $guild: guild_id
    });
}

/*
    Function: upsertSticker
    Purpose:  Insert a sticker into the database. If the sticker already exists update its name
    in:       The database object
    in:       The sticker object
    in:       The ID of the guild the sticker is from
*/
async function upsertSticker(db, data, guild_id=null)
{
    await db.run("insert into stickers values ($id, $guild, $name) on conflict (id) do update set name = $name",
    {
        $id: data.id,
        $name: data.name,
        $guild: guild_id
    });
}

/*
    Function: upsertGuild
    Purpose:  Insert a guild into the database. If it already exists update its variable attributes which may change over time
    in:       The database object
    in:       The guild data object
*/
async function upsertGuild(db, guild_data)
{
    await db.run("insert into guilds values ($id, $name, $owner, $desc, $region, $ver, $exp, $nsfw, $prefloc, (select datetime())) on conflict(id) do update \
                  set name = $name, description = $desc, verification_level = $ver, nsfw = $nsfw, last_scraped = (select datetime())", 
                  {
                      $id: guild_data.id,
                      $name: guild_data.name,
                      $desc: guild_data.description,
                      $owner: guild_data.owner_id,
                      $region: guild_data.region,
                      $ver: guild_data.verification_level,
                      $exp: guild_data.explicit_content_filter,
                      $nsfw: guild_data.nsfw,
                      $prefloc: guild_data.preferred_locale
                  });
}

/*
    Function: upsertChannel
    Purpose:  Insert or update attribute of a channel into the database
    in:       The database object
    in:       The channel data object
*/
async function upsertChannel(db, channel_data)
{
    if(!TEXT_CHANNELS.has(channel_data.type)){
        return;
    }

    if(!channel_data.hasOwnProperty("owner_id")){
        channel_data.owner_id = null;
    }

    if(!channel_data.hasOwnProperty("topic")){
        channel_data.topic = null;
    }

    let type = channel_data.type;
    if(type < CHANNEL_TYPES.GUILD_PUBLIC_THREAD || type > CHANNEL_TYPES.GUILD_PRIVATE_THREAD){
        channel_data.parent_id = null;
    }
    
    await db.run("insert into channels values ($id, $guild, $parent, $owner, $type, $name, $topic) on conflict(id) \
                  do update set name = $name, topic = $topic",
                  {
                      $id: channel_data.id,
                      $guild: channel_data.guild_id,
                      $parent: channel_data.parent_id,
                      $owner: channel_data.owner_id,
                      $type: channel_data.type,
                      $name: channel_data.name,
                      $topic: channel_data.topic
                  });
}

/*
    Function: upsertRole
    Purpose:  Insert a role into the database. If it already exists update its changeable attributes
    in:       The database object
    in:       The role data object
    in:       The ID of the guild the role is from
*/
async function upsertRole(db, role, guild_id)
{
    await db.run("insert into roles values ($id, $guild, $name, $perms, $ment) on conflict (id) \
                  do update set name = $name, permissions = $perms, mentionable = $ment",
                  {
                      $id: role.id,
                      $guild: guild_id,
                      $name: role.name,
                      $perms: role.permissions,
                      $ment: role.mentionable
                  });
}

/*
    Function: verifyChannelAccess
    Purpose:  Check to see if the client has access to a channel. (This is important because hidden or deleted channels 
              with varying perms can be seen be everybody)
    in:       The Discord rest client
    in:       The ID of the channel to check
*/
async function verifyChannelAccess(client, channel_id)
{
    try{
        await client.getChannel(channel_id);
        return true;
    }
    catch(err){
        return false;
    }
}

/*
    Function: getLastMessageID
    Purpose:  Get the ID of the last message sent in a channel
    in:       The database object
    in:       The ID of the channe
*/
async function getLastMessageID(db, channel_id)
{
    return (await db.get("select max(id) as id from messages where channel_id = ?", [channel_id])).id;
}

/*
    Function: upsertUserDetail
    Purpose:  Take a user data object and insert the user itself while also upserting the user's aliases
    in:       The database object
    in:       The user data object
*/
async function upsertUserDetails(db, user)
{
    await insertUser(db, user.id, user.bot);
    let alias_id = await insertAlias(db, user.username, user.discriminator);
    await upsertAliasRelation(db, user.id, alias_id);
}

/*
    Function: insertAttachment
    Purpose:  Insert an attachment of a message into the database
    in:       The database object
    in:       The attachment data object
    in:       The ID of the message the attachment was from
*/
async function insertAttachment(db, attachment, message_id)
{
    let filetype = null;
    if(attachment.hasOwnProperty("content_type")){
        filetype = attachment.content_type;
    }

    await db.run("insert or ignore into attachments values (?, ?, ?, ?, ?, ?, ?)",
                  [
                      attachment.id,
                      message_id,
                      attachment.filename,
                      attachment.size,
                      attachment.url,
                      attachment.proxy_url,
                      filetype
                  ]);
}

/*
    Function: insertMessage
    Purpose:  Insert a message into the database. Since this project mainly bases around Discord's rest API
              this function takes care of updating various user attributes too if so desired as message data
              contains lots of extra information in it. Looking back, this was a bad decision and the functionalities
              should definitely be separated
    in:       The database object
    in:       The rest client
    in:       The message data object
    in:       The ID of the guild the message is from
    in:       Whether to update the author's linked accounts when inserting
    in:       Whether to update the author's guild roles when inserting
*/
async function insertMessage(db, client, message, guild_id, update_accounts=false, update_roles=false)
{
    let author = message.author;
    let user_new = !(await db.get("select exists(select * from users where id = ?) as e", [author.id])).e;

    await db.run("begin");
    await upsertUserDetails(db, author);

    if(update_roles || update_accounts || user_new){
        try{
            let profile = await client.getUserProfile(author.id, guild_id);
            if(profile.hasOwnProperty("connected_accounts")){
                await insertUserAccounts(db, profile.user.id, profile.connected_accounts);
            }
            
            if(profile.hasOwnProperty("guild_member"))
                await insertUserRoles(db, client, guild_id, author.id, profile.guild_member.roles);
        }
        catch(err){
            //yes we're swallowing this error, it doesn't need to be used for anything
        }
    }

    let ref = null;
    if(message.hasOwnProperty("message_reference")){
	if((await db.get("select exists(select * from messages where id = ?) as e", [message.message_reference.message_id])).e){
		ref = message.message_reference.message_id;
	}
    }
    
    await db.run("insert into messages values ($id, $author, $chan, $text, $ref, $time, $edit, $pin, $every) on conflict (id) \
                  do update set content = $text, edit_timestamp = $edit, pinned = $pin, mention_everyone = $every",
                  {
                      $id: message.id,
                      $author: author.id,
                      $chan: message.channel_id,
                      $text: message.content,
                      $ref: ref,
                      $time: message.timestamp,
                      $edit: message.edited_timestamp,
                      $pin: message.pinned,
                      $every: message.mention_everyone
    });
    
    //insert all of the stickers from the message into the database and possibly
    //partial guild information about the sticker
    if(message.hasOwnProperty("sticker_items")){
        for(let s of message.sticker_items){
            let sticker_guild_id;
            let guild_info;
            try{
                let info = await client.getSticker(s.id);
                sticker_guild_id = info.guild_id;
                try{
                    guild_info = await client.getStickerGuild(s.id);
                    await db.run("insert into guilds (id, name, description, preferred_locale) \
                                  values ($id, $name, $desc, $prefloc) on conflict (id) \
                                  do update set name = $name, description = $desc, preferred_locale = $prefloc",
                                  {
                                      $id: sticker_guild_id,
                                      $name: guild_info.name,
                                      $desc: guild_info.description,
                                      $prefloc: guild_info.preferred_locale
                                  });
                }
                catch(err){
                    await db.run("insert or ignore into guilds (id) values (?)", [sticker_guild_id]);
                }
            }
            catch(err){
                sticker_guild_id = null;
            }

            await upsertSticker(db, s, sticker_guild_id);
            await db.run("insert or ignore into message_stickers values (?, ?)", [message.id, s.id]);
        }
    }

    for(let r of message.mention_roles){
        if(!(await db.get("select exists(select * from roles where id = ?) as e", [r])).e){
            await db.run("insert into roles (id, guild_id) values (?, ?)", [r, guild_id]);
        }
        await db.run("insert or ignore into role_mentions values (?, ?)", [message.id, r]);
    }

    for(let u of message.mentions){
        await upsertUserDetails(db, u);
        await db.run("insert or ignore into user_mentions values (?, ?)", [message.id, u.id]);
    }

    for(let a of message.attachments){
        await insertAttachment(db, a, message.id);
    }

    if(message.hasOwnProperty("thread")){
        await upsertChannel(db, message.thread);
    }

    await db.run("commit");
}

/*
    Function: scrapeMessages
    Purpose:  Scrape messages from a specified channel and insert them into the database
    in:       The database object
    in:       The Discord rest client
    in:       The ID of the channel to scrape
    in:       The express request object so that app locals can be accessed
*/
async function scrapeMessages(db, client, channel_id, guild_id, req)
{
    if(await verifyChannelAccess(client, channel_id)){
        req.app.locals.scrape_status.channel_id = channel_id;
        let last_id = await getLastMessageID(db, channel_id);
        if(last_id === null){
            last_id = 0;
        }

        while(!req.app.locals.scrape_status.skip_channel && req.app.locals.scrape_status.scraping){
            let messages = await client.getChannelMessages(channel_id, {after: last_id.toString()});
            if(messages.length === 0){
                break;
            }

            for(let i=messages.length-1; i>=0; i--){
                let m = messages[i];
                await insertMessage(db, client, m, guild_id);
            }
            last_id = messages[0].id;
        }
    }

    req.app.locals.scrape_status.skip_channel = false;
}

/*
    Function: verifyGuild
    Purpose:  Make sure that a client is actually part of a guild before continuing
              (forgive the linear search, this was near the end of implementation)
*/
function verifyGuild(req, res, next)
{
    for(let g of req.app.locals.client_guilds){
        if(req.params.id === g.id){
            next();
            break;
        }
    }
    res.status(404).send();
}

/*
    Function: scrape
    Purpose:  Sets the scraping status of the program and starts scraping the specified guild before
              sending back a response to tell the client that things are underway
*/
function scrape(req, res, next)
{
    if(!req.app.locals.scrape_status.scraping){
        req.app.locals.scrape_status.scraping = true;
        req.app.locals.scrape_status.guild_id = req.params.id;
        scrapeGuild(req);
        res.status(202).send();
    }
    else{
        res.status(500).send();
    }
}

/*
    Function: scrapeGuild
    Purpose:  Scrape the guild specified by the client using the ID parameter specified in the request URL
*/
async function scrapeGuild(req)
{
    let db = req.app.locals.db;
    let client = req.app.locals.restClient;
    let guild_id = req.params.id;
    
    let guild_data = await client.getGuild(guild_id);
    let profile = await client.getUserProfile(guild_data.owner_id, guild_id);
    

    //updates the owner info
    await db.run("begin");
    await upsertUserDetails(db, profile.user);

    if(profile.hasOwnProperty("connected_accounts")){
        await insertUserAccounts(db, profile.user.id, profile.connected_accounts);
    }

    await upsertGuild(db, guild_data);

    for(let e of guild_data.emojis){
        await upsertEmoji(db, e, guild_data.id);
    }

    for(let s of guild_data.stickers){
        await upsertSticker(db, s, guild_data.id);
    }

    for(let r of guild_data.roles){
        await upsertRole(db, r, guild_data.id);
    }

    if(profile.hasOwnProperty("guild_member")){
        await insertUserRoles(db, client, guild_data.id, guild_data.owner_id, profile.guild_member.roles);
    }

    await db.run("commit");

    let channels = await client.getGuildChannels(guild_data.id);
    for(let c of channels){
	
	
        await upsertChannel(db, c);
        await scrapeMessages(db, client, c.id, guild_id, req);

        if(!req.app.locals.scrape_status.scraping){
            break;
        }
    }

    req.app.locals.scrape_status.scraping = false;
}

module.exports = router;