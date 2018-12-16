-- social
INSERT INTO
  social (name)
  VALUES
  ('Facebook'),
  ('Twitter'),
  ('Github'),
  ('Instagram');

-- categories
INSERT INTO
  category (name)
  VALUES ('Opća obavijest'), ('Informacijska Tehnologija'), ('Ekonomija'), ('Racunovodstvo'), ('Elektrotehnika'), ('Strojarstvo');

-- post type
INSERT INTO
  post_type (name)
  VALUES ('Posao'), ('Praksa'), ('Radionica'), ('Predavanje'), ('Obavijest');

-- superadmin@mail.com/superadmin
INSERT INTO
  "user" (email, password, address, zip_code, country_code)
  VALUES ('superadmin@mail.com', '$2a$12$71wzyR81R9wDBSchxS9t/.fMjrsIarJwdHnNZE4dVsPqMudRhfIHa', 'Kopilica', 21000, 'HR');
INSERT INTO
  user_role (user_id, role)
  VALUES (currval('user_id_seq'), 20);

-- student1@mail.com/student1
INSERT INTO
  "user" (email, password, address, phone, zip_code, country_code)
  VALUES ('student1@mail.com', '$2a$04$RBovfBLYzzgnm8xLNdj5SO.n1v2j9gawfxyIo5cMoHXdX9FxMJ8IC', 'Ujeviceva 1', '023-773-124', 21000, 'HR');
INSERT INTO
  user_role (user_id, role)
  VALUES (currval('user_id_seq'), 0);
INSERT INTO
  student (user_id, first_name, last_name, cv_link)
  VALUES (currval('user_id_seq'), 'Leon', 'Petrov', 'nekakav_link_dotcom');
INSERT INTO
  user_category (user_id, category_id)
  VALUES
  (currval('user_id_seq'), 1),
  (currval('user_id_seq'), 2);


-- student2@mail.com/student2
INSERT INTO
  "user" (email, password, address, phone, zip_code, country_code)
  VALUES ('student2@mail.com', '$2a$04$AhkjNNK9Un//kxqzipFqY./3OkVUBm4polQGxuBXrTncZQ/WSZenO', 'Nova V, Br. 7', '526-521-656', 22203, 'HR');
INSERT INTO
  user_role (user_id, role)
  VALUES (currval('user_id_seq'), 0);
INSERT INTO
  student (user_id, first_name, last_name)
  VALUES (currval('user_id_seq'), 'Lana', 'Brajkovic');

-- student3@mail.com/student3
INSERT INTO
  "user" (email,  password, address, phone, zip_code, country_code)
  VALUES ('student3@mail.com', '$2a$04$PfaNP5HyE4yLXtoBPG3bSeUnZ6enKJH4zPJWSPq7EPmSxbKIhOYDC', 'Trg marsala Tita 11', '099-444-6556', 10000, 'HR');
INSERT INTO
  user_role (user_id, role)
  VALUES (currval('user_id_seq'), 0);
INSERT INTO
  student (user_id, first_name, last_name)
  VALUES (currval('user_id_seq'), 'Vlatko', 'Mirko');

-- company1@mail.com/company1
INSERT INTO
  "user" (email, password, address, phone, zip_code, country_code)
  VALUES ('company1@mail.com', '$2a$04$sBKzD7S1MTCKfpDI88vVAuJMzwfvqddcEV6Ea5uDYxZd6VGtWqnJG', 'Simiceva 23', '091-425-6435', 21000, 'HR');
INSERT INTO
  user_role (user_id, role)
  VALUES (currval('user_id_seq'), 10);
INSERT INTO
  company(user_id, name, oib, info)
  VALUES (currval('user_id_seq'), 'AwesomeIng', 12534456521, 'Block development company with funny name');
INSERT INTO
  post (company_id, type_id, info)
  VALUES
  (currval('user_id_seq'), 5,  'Dragi studenti, ovim putem vas obavijestavamo da u subotu 13.8.2017. imamo dane otvorenih vrata te vas pozivamo da nam se pridruzite u sto vecem broju');
INSERT INTO
  post_category (post_id, category_id)
  VALUES
  (currval('post_id_seq'), 1),
  (currval('post_id_seq'), 4);

-- company2@mail.com/company2
INSERT INTO
  "user" (email, password, address, phone, zip_code, country_code)
  VALUES ('company2@mail.com', '$2a$04$9zhJPJVc40PoYWZJT0VsLe0Qrtvi8Km6K4Ue8rChJ/r8YVFzT/ViS', 'Domovinskog rata 53', '099-521-655', 21000, 'HR');
INSERT INTO
  user_role (user_id, role)
  VALUES (currval('user_id_seq'), 10);
INSERT INTO
  company (user_id, name, oib, info)
  VALUES (currval('user_id_seq'), 'FiveRow', 44557753236, 'Greates company of them all, looking for awesome new hire');
INSERT INTO
  post (company_id, type_id, info)
  VALUES
  (currval('user_id_seq'), 2, 'Trazimo studenta za obavljanje strucne prakse'),
  (currval('user_id_seq'), 4, 'U petak 22.5.2018. drzimo predavanje na temu asinkronih funkcija u JavaScript-u');
INSERT INTO
  post_category (post_id, category_id)
  VALUES
  (currval('post_id_seq'), 1),
  (currval('post_id_seq'), 4);


