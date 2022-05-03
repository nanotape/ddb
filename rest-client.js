const axios = require("axios");
const path = require("path");
const sleep =require("./utils.js").general.sleep;

const MAX_OFFSET = 5000;
const RATELIMIT_KEY = "retry_after";

const {
    ERR_CLIENT_MISSING_ACCESS,
    ERR_RESOURCE_UNAVAILABLE,
    ERR_SERVER_INTERNAL_500
} = require("./errors");

class DiscordRestClient 
{
    
    constructor({token, base_api_url, api_version, request_delay, ratelimit_delay, retry_count, headers={}})
    {
        this.base_api_url = base_api_url + (base_api_url.charAt(-1) !== '/' ? '/' : '') + `v${api_version}`; 
        this.api_version = api_version;
        this.request_delay = request_delay;
        this.ratelimit_delay = ratelimit_delay;
        this.retry_count = retry_count;
        this.headers = headers;
        this.headers["Authorization"] = token;
    }

    /*
        Function: request
        Purpose:
        in:       The HTTP method to use for the request
        in:       The URL to send the request to
        in:       An object containing the query parameters in the URL
    */
    async #request(method, url, params)
    {
        let tries = this.retry_count;
        while(true){
            try{
                let res = await axios.request({
                    method: method, 
                    baseURL: this.base_api_url, 
                    url: url, 
                    headers: this.headers,
                    params: params
                });
                await sleep(this.request_delay * 1000);
                return res;
            }
            catch(err){
		if(err.hasOwnProperty("response") && typeof err.response !== "undefined" &&  err.response.hasOwnProperty("status")){
	                switch(err.response.status){
	                    case 403:
	                        throw new ERR_CLIENT_MISSING_ACCESS(url);

	                    case 404:
	                        throw new ERR_RESOURCE_UNAVAILABLE(url);

	                    case 429:
	                        let seconds = err.response.headers["retry-after"];
	                        await sleep((seconds + this.ratelimit_delay) * 1000);
	                        break;

			    case 500:
				throw new ERR_SERVER_INTERNAL_500(url);

			    default:
				break;
			}
                }                
                tries--;
                if(tries == 0)
                    throw err;
            }
        }
    }

    async #get(url, params=null)
    {
        return (await this.#request("get", url, params)).data;
    }

    /*
        Function: getChannelMessags
        Purpose:
        in:
        in:
        in:
        in:
        in:
        return:
    */
    //* NOTE *//  Make sure to implement functionality so that if a user requests more than MAX_OFFSET
    //        //  then the program will automatically handle retrieving more
    async getChannelMessages(id, {limit=50, after=null, before=null, around=null})
    {
        return await this.#get(path.join("channels", id, "messages"), {
            limit: limit, 
            after: after, 
            before: before,
            around: around
        });
    }

    /*
        Function: getGatewayURL
        Purpose:  Retrieves the url for Discord's websocket gateway
    */
    async getGatewayURL()
    {
        return (await this.#get("gateway")).url;
    }

    /*
        Function: getGuild
        Purpose:  Retrieve a partial guild object
        in:       The ID of the guild
    */
    async getGuild(id)
    {
        return await this.#get(path.join("guilds", id));
    }
    
    /*
        Function: getChannel
        Purpose:  Retrieve a channel object
        in:       The ID of the channel
    */
    async getChannel(id)
    {
        return await this.#get(path.join("channels", id));
    }

    /*
        Function: getGuildChannels
        Purpose:  Retrieve the channels present in a specific guild. Due to Discord's design
                  this method also returns deleted channels for some reason
        in:       The ID of the guild
    */
    async getGuildChannels(id)
    {
        return await this.#get(path.join("guilds", id, "channels"));
    }

    /*
        Function: getChannelThreads
        Purpose:  Retrieve all of the archived threads in a specific channel
        in:       The ID of the channel
    */
    async getChannelThreads(id)
    {
        return await this.#get(path.join("channels", id, "threads/archived/public"));
    }

    async searchGuild(id, options=null)
    {
        return await this.#get(path.join("guilds", id, "messages/search"), options);
    }

    async getDiscoverableGuilds(categories=5)
    {
        return await this.#get("discoverable-guilds", {categories: categories});
    }

    async getGuildCategories(locale="en-US", primary_only=false)
    {
        return await this.#get("discovery/categories", {
            locale: locale,
            primary_only: primary_only
        });
    }

    async getGuildRecommendations(personalization_disabled=true, client_type=3)
    {
        return (await this.#get("guild-recommendations", {
            personalization_disabled: personalization_disabled,
            client_type: client_type
        })).recommended_guilds;
    }

    async getUserProfile(user_id, guild_id)
    {
        return await this.#get(path.join("users", user_id, "profile"), {
            with_mutual_guilds: true,
            guild_id: guild_id
        });
    }

    async getClientInfo()
    {
        return await this.#get("users/@me");
    }

    async getClientGuilds()
    {
        return await this.#get("users/@me/guilds");
    }

    async getSticker(id)
    {
        return await this.#get(path.join("stickers", id));
    }

    async getStickerGuild(id)
    {
        return await this.#get(path.join("stickers", id, "guild"));
    }

    async getMessageReactions(channel_id, message_id, emoji_data, count)
    {
        const MAX_LIMIT = 100;
        let last_id = 0;
        let results = [];
        let emoji = encodeURIComponent(`${emoji_data.name}:${emoji_data.id}`);
        let path = path.join("channels", channel_id, "messages", message_id, "reactions", emoji);
        while(count > 0){
            results.push.apply(results, await this.#get(path, {limit: MAX_LIMIT, after: last_id}));
            last_id = results[results.length - 1].id;
            count -= MAX_LIMIT;
        }

        return results;
    }
};

module.exports = DiscordRestClient;
