create table if not exists user_aliases 
( 
    user_id text not null references users, 
    alias_id text not null references aliases, 
    last_used text not null, 
    primary key (user_id, alias_id) 
);

create index if not exists user_aliases_index_0 on user_aliases (last_used);
create index if not exists user_aliases_index_1 on user_aliases (alias_id);
