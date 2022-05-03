import {search, getID} from "./results.js";

function getGuildOptions(id)
{
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        if(req.readyState == 4){
            if(req.status == 200){
                let guilds = JSON.parse(req.responseText);
                let select = document.getElementById("guild-select");
                for(let g of guilds){
                    let option = document.createElement("option");
                    option.value = g.id;
                    option.innerText = g.id;
                    select.appendChild(option);
                }
            }
            else{
                alert("An error occurred");
            }
        }
    }

    req.open("GET", `/users/${id}/guilds`, true);
    req.send();
}

function searchRoles(user_id)
{
    return () => {
        let guild_id = document.getElementById("guild-select").value;
        search("role-results", "roles", null, `/users/${user_id}/guilds/${guild_id}`);
    }
}

function init()
{
    let id = getID();
    let path = `/users/${id}`;
    search("guilds", "guilds", null, path);
    search("aliases", "aliases", null, path);
    search("connected-accounts", "accounts", null, path);
    getGuildOptions(id);
    document.getElementById("search-button").addEventListener("click", searchRoles(id));
}

init();