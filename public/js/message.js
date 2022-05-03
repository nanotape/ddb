import {search, getID} from "./results.js";

function init()
{
    let id = getID();
    let path = `/messages/${id}`
    search("attachments", "attachments", new URLSearchParams({message_id: id}));
    search("stickers", "stickers", null, path)
    search("user-mentions", "users", null, path);
    search("role-mentions", "roles", null, path);
}

init();