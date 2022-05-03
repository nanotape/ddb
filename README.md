# Discord Database
A fairly crude rest API, user web interface, and Discord scraper made for the final project in COMP 3005 at Carleton.

# Usage
Installation:

`$ npm install`

Running:

`$ npm start`

Default Access:

http://127.0.0.1:3000

Further configuration options are described below.

# conf.json

### __token__: 
The account token used by the program to authenticate and access Discord's services. This can be found by going into developer mode on either browser or the app itself and taking it from a request header in the network activity logger. There's tons of guides on how to do this so I won't show exactly how here.

### __request_delay__:
The delay in seconds between each request sent by the rest client. Although this client automatically waits when its been told to by Discord, you dhoul be careful when changing this as Discord's ratelimits may set you back a considerable amount of time if you throttle too frequently.

### __ratelimit_delay__:
The delay in seconds to wait after the client has already waited the amount said by Discord. Depending on how quickly you go back to scraping Discord may impose longer ratelimits on you, so once again change this with discretion.

### __db_path__:
The folder that the program will create your sqlite database in.

### __paths_relative__:
Whether the program should take path type attributes in the config file and interpret them as relative to the current working directory or absolute.

### __overwrite__:
Whether the program should overwrite the old database on every launch (primarily used for debugging).

# NOTE
Although the program is capable, issues are still being found with it albeit after having more than 8M total messages scraped during testing. Use at your own risk.