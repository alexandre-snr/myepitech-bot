CREATE TABLE errors (
    id serial PRIMARY KEY,
    email VARCHAR (256) NOT NULL,
    created TIMESTAMPTZ NOT NULL,
    error VARCHAR (1024) NOT NULL
);