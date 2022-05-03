create table if not exists attachments 
(
    id text not null primary key, 
    message_id text not null references messages, 
    filename text not null, 
    size integer not null, 
    url text not null, 
    proxy_url text not null, 
    filetype text
);

create index if not exists attachments_index_0 on attachments (message_id);