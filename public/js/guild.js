import {search, getID} from "./results.js";

function init()
{
    let id = getID();
    let path = `/guilds/${id}`;
    search("users", "users", null, path);
    search("stickers", "stickers", new URLSearchParams({guild_id: id}));
    search("emojis", "emojis", new URLSearchParams({guild_id: id}));
    search("channels", "channels", new URLSearchParams({guild_id: id}));
    search("roles", "roles", new URLSearchParams({guild_id: id}));
}

init();