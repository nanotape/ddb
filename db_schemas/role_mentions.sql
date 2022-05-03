create table if not exists role_mentions 
( 
    message_id text not null references messages, 
    role_id text not null references roles, 
    primary key (message_id, role_id) 
);