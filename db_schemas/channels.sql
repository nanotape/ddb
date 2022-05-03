create table if not exists channels 
( 
    id text not null primary key, 
    guild_id text not null references guilds, 
    parent_id text references messages, 
    owner_id text references users, 
    type integer not null, 
    name text not null, 
    topic text
);

create index if not exists channels_index_0 on channels (guild_id);