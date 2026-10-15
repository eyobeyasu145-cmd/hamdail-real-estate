CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
  phone TEXT,
  address TEXT,
  profile_pic TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(15, 2) NOT NULL CHECK (price > 0),
  security_deposit NUMERIC(15, 2) CHECK (security_deposit IS NULL OR security_deposit >= 0),
  maintenance NUMERIC(15, 2) CHECK (maintenance IS NULL OR maintenance >= 0),
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  pincode TEXT NOT NULL,
  property_type TEXT NOT NULL,
  bhk TEXT,
  bathrooms INTEGER CHECK (bathrooms IS NULL OR bathrooms >= 0),
  area_size NUMERIC(12, 2) CHECK (area_size IS NULL OR area_size > 0),
  furnishing TEXT,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'sale'
    CHECK (status IN ('sale', 'rent', 'sold', 'rented', 'active', 'pending')),
  images TEXT[] NOT NULL DEFAULT '{}',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX properties_seller_id_idx ON properties(seller_id);
CREATE INDEX properties_status_created_at_idx ON properties(status, created_at DESC);
CREATE INDEX properties_city_idx ON properties(city);
CREATE INDEX contact_messages_created_at_idx ON contact_messages(created_at DESC);
