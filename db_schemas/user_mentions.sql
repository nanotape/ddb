create table if not exists user_mentions 
( 
    message_id text not null references messages, 
    user_id text not null references users, 
    primary key (message_id, user_id) 
);