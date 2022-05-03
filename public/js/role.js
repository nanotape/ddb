import {search, getID} from "./results.js";

function init()
{
    let id = getID();
    search("users", "users", null, `/roles/${id}`);
}

init();