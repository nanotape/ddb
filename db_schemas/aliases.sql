create table if not exists aliases 
(
    id integer not null primary key autoincrement,
    username text not null,
    discriminator text not null
); 

create unique index if not exists aliases_index_0 on aliases (username, discriminator);