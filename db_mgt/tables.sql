create table if not exists event_meta
(
	id int auto_increment
		primary key,
	meta_key varchar(128) not null,
	meta_value varchar(128) null
);

create table if not exists event
(
	id int auto_increment
		primary key,
	event_name varchar(128) not null,
	event_description varchar(1024) null,
	event_location int null,
	event_cost varchar(128) null,
	event_sign_up varchar(128) null,
	event_EC_pickup varchar(128) null,
	event_HL_pick_up varchar(128) null,
	constraint event_ibfk_1
		foreign key (event_location) references event_meta (id)
);

create index event_location
	on event (event_location);

create table if not exists event_meta_tbl
(
	event_id int not null,
	meta_id int not null,
	primary key (event_id, meta_id),
	constraint event_meta_tbl_ibfk_1
		foreign key (event_id) references event (id)
			on delete cascade,
	constraint event_meta_tbl_ibfk_2
		foreign key (meta_id) references event_meta (id)
			on delete cascade
);

create index meta_id
	on event_meta_tbl (meta_id);

create table if not exists event_time
(
	id int auto_increment
		primary key,
	event_id int null,
	all_day_event tinyint(1) null,
	start datetime null,
	end datetime null,
	constraint event_time_ibfk_1
		foreign key (event_id) references event (id)
);

create index event_id
	on event_time (event_id);

create table if not exists handy_url
(
	id int auto_increment
		primary key,
	short_name varchar(20) null,
	full_url varchar(128) null,
	purpose varchar(250) null
);

create table if not exists page
(
	id int auto_increment
		primary key,
	page_title varchar(128) not null,
	page_name varchar(256) not null,
	page_active tinyint(1) null,
	page_author varchar(128) null,
	page_date datetime null,
	page_content varchar(30000) null,
	page_status varchar(32) not null,
	page_parent int null,
	page_guid varchar(256) not null,
	page_cached tinyint(1) null,
	page_do_not_cache tinyint(1) null,
	page_cached_date datetime null,
	page_cached_content varchar(30000) null,
	page_do_not_import tinyint(1) null,
	constraint page_name
		unique (page_name),
	constraint page_ibfk_1
		foreign key (page_parent) references page (id)
);

create index page_parent
	on page (page_parent);

create table if not exists page_meta
(
	id int auto_increment
		primary key,
	page_id int not null,
	meta_key varchar(128) not null,
	meta_value varchar(256) null,
	constraint page_meta_ibfk_1
		foreign key (page_id) references page (id)
);

create index page_id
	on page_meta (page_id);

create table if not exists photo_gallery
(
	id int auto_increment
		primary key,
	old_id int null,
	name varchar(256) not null,
	slug_name varchar(256) not null,
	path_name varchar(256) not null
);

create table if not exists photo
(
	id int auto_increment
		primary key,
	old_id int not null,
	image_slug varchar(256) not null,
	gallery_id int null,
	old_gallery_id int null,
	file_name varchar(256) null,
	caption varchar(512) null,
	alt_text varchar(256) null,
	image_date datetime null,
	meta_data text null,
	constraint photo_ibfk_1
		foreign key (gallery_id) references photo_gallery (id)
);

create index gallery_id
	on photo (gallery_id);

create table if not exists photo_gallery_meta
(
	id int auto_increment
		primary key,
	gallery_id int not null,
	meta_key varchar(128) not null,
	meta_value varchar(256) null,
	constraint photo_gallery_meta_ibfk_1
		foreign key (gallery_id) references photo_gallery (id)
);

create index gallery_id
	on photo_gallery_meta (gallery_id);

create table if not exists photo_meta
(
	id int auto_increment
		primary key,
	gallery_id int not null,
	meta_key varchar(128) not null,
	meta_value varchar(256) null,
	constraint photo_meta_ibfk_1
		foreign key (gallery_id) references photo_gallery (id)
);

create index gallery_id
	on photo_meta (gallery_id);

create table if not exists role
(
	id int auto_increment
		primary key,
	name varchar(80) not null,
	description varchar(255) null
);

create table if not exists roles
(
	id int auto_increment
		primary key,
	name varchar(50) null,
	constraint name
		unique (name)
);

create table if not exists roles_users
(
	user_id int null,
	role_id int null
);

create table if not exists users
(
	id int auto_increment
		primary key,
	username varchar(256) not null,
	email varchar(40) not null,
	password varchar(200) not null,
	website varchar(60) null,
	created_on datetime null,
	last_login datetime null,
	active tinyint(1) null,
	email_confirmed_at datetime null,
	constraint email
		unique (email)
);

create table if not exists user_roles
(
	id int auto_increment
		primary key,
	user_id int null,
	role_id int null,
	constraint user_roles_ibfk_1
		foreign key (role_id) references roles (id)
			on delete cascade,
	constraint user_roles_ibfk_2
		foreign key (user_id) references users (id)
			on delete cascade
);

create index role_id
	on user_roles (role_id);

create index user_id
	on  user_roles (user_id);

create table if not exists index_page
(
	id int auto_increment
		primary key,
	page_title varchar(128) not null,
	page_name varchar(128) not null unique,
	page_content varchar(8192) null,
	page_cached tinyint(1) null,
	sequence_type varchar(32) not null,
	page_template varchar(128) null
);

create index page_name_ndx
	on index_page (page_name);

create table if not exists index_page_item
(
	id int auto_increment
		primary key,
	item_name varchar(128) null,
	item_index_page int null,
	button_name varchar(128) null,
	button_page_url int null,
	button_url_link varchar(256) null,
	item_content varchar(1024) not null,
	item_date datetime null,
	sequence int null,
	constraint index_page_item_ibfk_1
		foreign key (button_page_url) references page (id),
	constraint index_page_item_ibfk_2
		foreign key (item_index_page) references index_page (id)
);

create index item_name_ndx
	on index_page_item (item_name);

