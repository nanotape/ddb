create table if not exists message_stickers 
( 
    message_id text not null references messages, 
    sticker_id text not null references stickers, 
    primary key (message_id, sticker_id) 
);