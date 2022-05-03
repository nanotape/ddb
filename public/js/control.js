function scrape(e)
{
    let id = e.target.value;
    let dest = `/control/${id}`;

    let req = new XMLHttpRequest();
    req.onreadystatechange = () => {
        if(req.readyState == 4){
            switch(req.status){
                case 202:
                    location.reload();
                    break;

                default:
                    alert("An error occurred");
                    break;
            }
        }
    }

    req.open("GET", dest, true);
    req.send();
}

function sendCommand(path)
{
    return () => {
        let req = new XMLHttpRequest();
        req.onreadystatechange = () => {
            if(req.readyState == 4){
                if(req.status == 200){
                    location.reload();
                }
            }
        }
        req.open("GET", path, true);
        req.send();
    }
}

function init()
{
    let buttons = document.getElementsByClassName("scrape-button");
    for(let b of buttons){
        b.addEventListener("click", scrape);
    }
    document.getElementById("request-guilds").addEventListener("click", sendCommand("/control/update"));
    document.getElementById("skip").addEventListener("click", sendCommand("/control/skip"));
    document.getElementById("stop").addEventListener("click", sendCommand("/control/stop"));
}

init();