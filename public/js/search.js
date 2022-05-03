import {search} from "./results.js";

const RESULTS_DIV = "results";

function searchButton()
{
    let entity = getEntity();
    let query = getQuery();
    search(RESULTS_DIV, entity, query)
}

function getEntity()
{
    return document.getElementById("entity-select").value.replace(/^./g, (c) => c.toLowerCase());
}

function getQuery()
{
    return parseElements(document.getElementById("search-input").value);
}

function parseElements(text)
{
    let query = new URLSearchParams();
    let vals = text.match(/\b\w+:\S+/g);
    if(vals !== null){
        for(let i of vals){
            let x = i.indexOf(":");
            let key = i.substring(0, x);
            let val = i.substring(x + 1).replace(/(?<!\\)\_/g, " ");
            query.append(key, val);
        }
    }
    return query;
}

function init()
{
    document.getElementById("search-button").addEventListener("click", searchButton);
}

init();