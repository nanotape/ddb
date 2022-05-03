create table if not exists user_roles 
( 
    user_id text not null references users, 
    role_id text not null references roles, 
    primary key (user_id, role_id) 
);

create index if not exists user_roles_index_0 on user_roles (role_id);
