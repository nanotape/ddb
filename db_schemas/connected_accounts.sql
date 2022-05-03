create table if not exists connected_accounts 
( 
    user_id text not null references users, 
    type text not null, 
    id text not null, 
    name text not null, 
    verified boolean, 
    primary key (user_id, type, id) 
);