alter table public.profiles
  add column legal_first_name text,
  add column legal_last_name text,
  add column phone_number text,
  add column address_line_1 text,
  add column address_line_2 text,
  add column city text,
  add column region text,
  add column postal_code text,
  add column country_code text not null default 'US',
  add column linkedin_url text,
  add column website_url text,
  add column work_authorized boolean,
  add column requires_sponsorship boolean;

alter table public.profiles
  add constraint profiles_legal_first_name_length
    check (legal_first_name is null or length(legal_first_name) <= 80),
  add constraint profiles_legal_last_name_length
    check (legal_last_name is null or length(legal_last_name) <= 80),
  add constraint profiles_phone_number_length
    check (phone_number is null or length(phone_number) <= 40),
  add constraint profiles_address_line_1_length
    check (address_line_1 is null or length(address_line_1) <= 160),
  add constraint profiles_address_line_2_length
    check (address_line_2 is null or length(address_line_2) <= 160),
  add constraint profiles_city_length
    check (city is null or length(city) <= 100),
  add constraint profiles_region_length
    check (region is null or length(region) <= 100),
  add constraint profiles_postal_code_length
    check (postal_code is null or length(postal_code) <= 24),
  add constraint profiles_country_code_format
    check (country_code ~ '^[A-Z]{2}$'),
  add constraint profiles_linkedin_url_format
    check (linkedin_url is null or linkedin_url ~ '^https://'),
  add constraint profiles_website_url_format
    check (website_url is null or website_url ~ '^https://');
