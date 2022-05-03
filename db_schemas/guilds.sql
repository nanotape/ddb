create table if not exists guilds 
(
    id text not null primary key, 
    name text not null default 'N/A', 
    owner_id text references users,  
    description text, 
    region text, 
    verification_level integer, 
    explicit_content_filter boolean, 
    nsfw boolean, 
    preferred_locale text,
    last_scraped text
);

create index if not exists guilds_index_0 on guilds (owner_id);