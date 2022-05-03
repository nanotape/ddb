create table if not exists stickers 
( 
    id text not null primary key, 
    guild_id text references guilds, 
    name text not null
);

create index if not exists stickers_index_0 on stickers (guild_id);
