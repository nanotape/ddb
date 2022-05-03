import {search, getID} from "./results.js";

function init()
{
    let id = getID();
    search("messages", "messages", new URLSearchParams({channel_id: id}));
}

init();