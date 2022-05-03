create table if not exists messages 
( 
    id text not null primary key, 
    author_id text not null references users, 
    channel_id text not null references channels, 
    content text, 
    referenced_message_id text references messages, 
    timestamp text not null, 
    edit_timestamp text, 
    pinned boolean not null, 
    mention_everyone boolean not null 
);

create index if not exists messages_index_0 on messages (author_id);
create index if not exists messages_index_1 on messages (channel_id);
create index if not exists messages_index_2 on messages (timestamp);