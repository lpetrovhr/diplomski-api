DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

CREATE TABLE "user" (
  id SERIAL,
  email VARCHAR(254) NOT NULL,
  password CHAR(60) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  image_fname TEXT,
  address TEXT NOT NULL,
  phone VARCHAR(15),
  zip_code VARCHAR(5) NOT NULL,
  country_code VARCHAR(5) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (email),
  UNIQUE (phone)
);

CREATE TABLE password_token (
  user_id INTEGER NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  token CHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id),
  UNIQUE (token)
);

CREATE TABLE user_role (
  user_id INTEGER NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  role SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id)
);

CREATE TABLE company (
  user_id INTEGER NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fax VARCHAR(15),
  oib VARCHAR(11) NOT NULL,
  info TEXT NOT NULL,
  PRIMARY KEY (user_id),
  UNIQUE (oib),
  UNIQUE (fax)
);

CREATE TABLE student (
  user_id INTEGER NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  cv_link TEXT,
  PRIMARY KEY (user_id)
);

CREATE TABLE social (
  id SERIAL,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (name)
);

CREATE TABLE user_social (
  user_id INTEGER NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  social_id INTEGER NOT NULL REFERENCES social (id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, social_id)
);

CREATE TABLE tags (
  id SERIAL,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (name)
);

CREATE TABLE user_tags (
  user_id INTEGER NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  tags_id INTEGER NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, tags_id)
);

CREATE TABLE category (
  id SERIAL,
  name VARCHAR(150) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE user_category (
  user_id INTEGER NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES category (id) ON DELETE RESTRICT,
  PRIMARY KEY (user_id, category_id)
);

CREATE TABLE post_type (
  id SERIAL,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE post (
  id SERIAL,
  company_id INTEGER NOT NULL REFERENCES company (user_id) ON DELETE CASCADE,
  type_id INTEGER NOT NULL REFERENCES post_type (id) ON DELETE RESTRICT,
  info TEXT NOT NULL,
  PRIMARY KEY (id)
);

/* closer look at this, with this logic user could respawn  to it's own events */

CREATE TABLE post_student (
  post_id INTEGER NOT NULL REFERENCES post (id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES student (user_id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, student_id)
);

CREATE TABLE post_category (
  post_id INTEGER NOT NULL REFERENCES post (id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES category (id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);