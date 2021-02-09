CREATE TABLE registrations (
    id serial PRIMARY KEY,
    email VARCHAR (256) UNIQUE NOT NULL,
    password VARCHAR (256) NOT NULL,
    twofactor VARCHAR (256) NOT NULL,
    lastCheck TIMESTAMPTZ NOT NULL
);