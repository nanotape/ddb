create table if not exists custom_emojis 
( 
    id text not null primary key, 
    guild_id text references guilds,  
    name text not null
);

create index if not exists custom_emojis_index_0 on custom_emojis (guild_id);
