create table if not exists roles 
( 
    id text not null primary key, 
    guild_id text not null references guilds, 
    name text, 
    permissions integer, 
    mentionable boolean 
);

create index if not exists roles_index_0 on roles (guild_id);
