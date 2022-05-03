const MAX_LIMIT = 50;

/*
    Function: capitalize
    Purpose:  Capitalize the first character of a string
*/
function capitalize(text)
{
    return text.replace(/^./g, (c) => c.toUpperCase());
}

export function getID()
{
    return window.location.pathname.match(/(?<=\/)[0-9]*$/g);
}

/*
    Function: prevNextButtons
    Purpose:  Create previous and next buttons for a table which will automatically
              render a new table as well as new buttons in a specified div each time
              one of them are pressed to go to another page
    in:       The ID of the div which the table is stored in
    in:       The URL of the request
    in:       The query parameters being sent in the URL
*/
export function prevNextButtons(tableDiv, entity, query=null, path="")
{
    function makeHandler(button, e, q)
    {
        let dest = `${path}/${e}?${q}`;
        button.addEventListener("click", () => {
            let req = new XMLHttpRequest();
            req.onreadystatechange = () => {
                if(req.readyState == 4){
                    if(req.status == 200){
                        let results = document.getElementById(tableDiv);
                        results.innerHTML = "";
                        let table = createTable(e, JSON.parse(req.responseText));
                        results.appendChild(table);
                        prevNextButtons(tableDiv, e, q, path);
                    }
                }
            }

            req.open("GET", dest, true);
            req.setRequestHeader("Accept", "application/json");
            req.send();
        });
    }

    if(query === null)
        query = new URLSearchParams();

    let div = document.getElementById(tableDiv);
    let baseline;
    if(query.has("offset")){
        baseline = query.get("offset");
    }
    else{
        query.set("offset", 0);
        baseline = 0;
    }

    if(baseline > 0){
        let prev = document.createElement("button");
        prev.textContent = "Prev";
        let prevQuery = new URLSearchParams(query);
        prevQuery.set("offset", baseline - MAX_LIMIT > 0 ? baseline - MAX_LIMIT : 0);
        makeHandler(prev, entity, prevQuery);
        div.appendChild(prev);
    }

    let next = document.createElement("button");
    next.textContent = "Next";
    let nextQuery = new URLSearchParams(query);
    nextQuery.set("offset", Number(baseline) + MAX_LIMIT);
    makeHandler(next, entity, nextQuery);
    div.appendChild(next);
}

/*
    Function: createTable
    Purpose:  Pain. I know it's bad trust me
    in:
    in:
    in:
*/
export function createTable(type, data)
{
    //headers have been put in lists instead of objects to preserve ordering
    let headers = [["id", true]];
    switch(type){
        case "messages":
            headers.push(
                ["content", false],
                ["timestamp", false]
            );
            break;

        case "guilds":
            headers.push(
                ["name", false]
            );
            break;

        case "users":
            headers.push(
                ["username", false],
                ["discriminator", false]
            );
            break;

        case "channels":
            headers.push(
                ["name", false]
            );
            break;
        
        case "attachments":
            headers.push(
                ["filename", false]
            );
            break;

        case "aliases":
            headers = [
                ["username", false],
                ["discriminator", false],
                ["last_used", false]
            ];
            break;

        case "accounts":
            headers = [
                ["type", false],
                ["id", false],
                ["name", false],
                ["verified", false]
            ];
            break;

        case "stickers":
            headers.push(
                ["name", false]
            );
            break;

        case "emojis":
            headers.push(
                ["name", false]
            );
            break;

        case "roles":
            headers.push(
                ["name", false]
            );
            break;
        
        default:
            return null;
    }

    let table = document.createElement("table");
    table.className = "results-table";

    let c = document.createElement("caption");
    c.textContent = capitalize(type);
    table.appendChild(c);

    let headersRow = document.createElement("tr");
    for(let i of headers){
        let heading = document.createElement("th");
        heading.textContent = capitalize(i[0]);
        headersRow.appendChild(heading);
    }
    table.appendChild(headersRow);

    for(let row of data){
        let tr = document.createElement("tr");

        for(let heading of headers){
            let key = heading[0];
            let isID = heading[1];
            let td = document.createElement("td");

            if(isID){
                let a = document.createElement("a");
                a.textContent = row[key];
                a.href = `/${key === "id" ? type : key + "s"}/${row[key]}`;
                td.appendChild(a);
            }
            else{
                td.textContent = row[key];
            }

            tr.appendChild(td);
        }
        
        table.appendChild(tr);
    }

    return table;
}

export function search(tableDiv, entity, query=null, path="")
{
    if(query === null)
        query = new URLSearchParams();
    
    let dest = `${path}/${entity}?${query}`;
    let req = new XMLHttpRequest();
    req.onreadystatechange = () => {
        if(req.readyState == 4){
            switch(req.status){
                case 200:
                    let results = document.getElementById(tableDiv);
                    results.innerHTML = "";
                    let table = createTable(entity, JSON.parse(req.responseText));
                    results.appendChild(table);
                    prevNextButtons(tableDiv, entity, query, path);
                    break;
                    
                case 500:
                    alert("Unknown error occurred");
                    break;
            }
        }
    }

    req.open("GET", dest, true);
    req.setRequestHeader("Accept", "application/json");
    req.send();
}
