-- ====================================================================
-- IDEAERA — Normalized States, Cities & Colleges Reference Data
-- ====================================================================

-- 1. States Table
CREATE TABLE IF NOT EXISTS public.states (
  id TEXT PRIMARY KEY, -- e.g. 'IN-TN', 'IN-KA'
  name TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  country TEXT DEFAULT 'India' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_states_name ON public.states(name);

-- 2. Cities Table
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state_id TEXT REFERENCES public.states(id) ON DELETE CASCADE,
  state_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(name, state_name)
);

CREATE INDEX IF NOT EXISTS idx_cities_state_name ON public.cities(state_name);
CREATE INDEX IF NOT EXISTS idx_cities_name ON public.cities(name);

-- 3. Colleges Table (Enhanced)
CREATE TABLE IF NOT EXISTS public.colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  city TEXT,
  state TEXT,
  state_id TEXT REFERENCES public.states(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_colleges_name ON public.colleges(name);
CREATE INDEX IF NOT EXISTS idx_colleges_state ON public.colleges(state);

-- Enable RLS
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- Read policies (Public / Authenticated)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'states' AND policyname = 'Anyone can view states') THEN
    CREATE POLICY "Anyone can view states" ON public.states FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cities' AND policyname = 'Anyone can view cities') THEN
    CREATE POLICY "Anyone can view cities" ON public.cities FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'colleges' AND policyname = 'Anyone can view colleges') THEN
    CREATE POLICY "Anyone can view colleges" ON public.colleges FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'colleges' AND policyname = 'Authenticated users can add colleges') THEN
    CREATE POLICY "Authenticated users can add colleges" ON public.colleges FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 4. Pre-seed All 28 Indian States & 8 Union Territories
INSERT INTO public.states (id, name, code, country) VALUES
  ('IN-AN', 'Andaman and Nicobar Islands', 'AN', 'India'),
  ('IN-AP', 'Andhra Pradesh', 'AP', 'India'),
  ('IN-AR', 'Arunachal Pradesh', 'AR', 'India'),
  ('IN-AS', 'Assam', 'AS', 'India'),
  ('IN-BR', 'Bihar', 'BR', 'India'),
  ('IN-CH', 'Chandigarh', 'CH', 'India'),
  ('IN-CT', 'Chhattisgarh', 'CT', 'India'),
  ('IN-DN', 'Dadra and Nagar Haveli and Daman and Diu', 'DN', 'India'),
  ('IN-DL', 'Delhi', 'DL', 'India'),
  ('IN-GA', 'Goa', 'GA', 'India'),
  ('IN-GJ', 'Gujarat', 'GJ', 'India'),
  ('IN-HR', 'Haryana', 'HR', 'India'),
  ('IN-HP', 'Himachal Pradesh', 'HP', 'India'),
  ('IN-JK', 'Jammu and Kashmir', 'JK', 'India'),
  ('IN-JH', 'Jharkhand', 'JH', 'India'),
  ('IN-KA', 'Karnataka', 'KA', 'India'),
  ('IN-KL', 'Kerala', 'KL', 'India'),
  ('IN-LA', 'Ladakh', 'LA', 'India'),
  ('IN-LD', 'Lakshadweep', 'LD', 'India'),
  ('IN-MP', 'Madhya Pradesh', 'MP', 'India'),
  ('IN-MH', 'Maharashtra', 'MH', 'India'),
  ('IN-MN', 'Manipur', 'MN', 'India'),
  ('IN-ML', 'Meghalaya', 'ML', 'India'),
  ('IN-MZ', 'Mizoram', 'MZ', 'India'),
  ('IN-NL', 'Nagaland', 'NL', 'India'),
  ('IN-OR', 'Odisha', 'OR', 'India'),
  ('IN-PY', 'Puducherry', 'PY', 'India'),
  ('IN-PB', 'Punjab', 'PB', 'India'),
  ('IN-RJ', 'Rajasthan', 'RJ', 'India'),
  ('IN-SK', 'Sikkim', 'SK', 'India'),
  ('IN-TN', 'Tamil Nadu', 'TN', 'India'),
  ('IN-TG', 'Telangana', 'TG', 'India'),
  ('IN-TR', 'Tripura', 'TR', 'India'),
  ('IN-UP', 'Uttar Pradesh', 'UP', 'India'),
  ('IN-UT', 'Uttarakhand', 'UT', 'India'),
  ('IN-WB', 'West Bengal', 'WB', 'India')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

-- 5. Seed Major Cities by State
-- Tamil Nadu Cities
INSERT INTO public.cities (name, state_id, state_name) VALUES
  ('Coimbatore', 'IN-TN', 'Tamil Nadu'),
  ('Chennai', 'IN-TN', 'Tamil Nadu'),
  ('Madurai', 'IN-TN', 'Tamil Nadu'),
  ('Salem', 'IN-TN', 'Tamil Nadu'),
  ('Tiruchirappalli', 'IN-TN', 'Tamil Nadu'),
  ('Vellore', 'IN-TN', 'Tamil Nadu'),
  ('Erode', 'IN-TN', 'Tamil Nadu'),
  ('Tiruppur', 'IN-TN', 'Tamil Nadu'),
  ('Tirunelveli', 'IN-TN', 'Tamil Nadu'),
  ('Thanjavur', 'IN-TN', 'Tamil Nadu'),
  ('Dindigul', 'IN-TN', 'Tamil Nadu'),
  ('Kanchipuram', 'IN-TN', 'Tamil Nadu'),
  ('Cuddalore', 'IN-TN', 'Tamil Nadu'),
  ('Hosur', 'IN-TN', 'Tamil Nadu'),
  ('Nagercoil', 'IN-TN', 'Tamil Nadu'),
  ('Karur', 'IN-TN', 'Tamil Nadu'),
  ('Kumbakonam', 'IN-TN', 'Tamil Nadu'),
  ('Sivakasi', 'IN-TN', 'Tamil Nadu'),
  ('Pollachi', 'IN-TN', 'Tamil Nadu'),
  ('Namakkal', 'IN-TN', 'Tamil Nadu'),
  ('Krishnagiri', 'IN-TN', 'Tamil Nadu'),
  ('Dharmapuri', 'IN-TN', 'Tamil Nadu'),
  ('Nagapattinam', 'IN-TN', 'Tamil Nadu'),
  ('Pudukkottai', 'IN-TN', 'Tamil Nadu'),
  ('Ooty', 'IN-TN', 'Tamil Nadu'),
  ('Kanyakumari', 'IN-TN', 'Tamil Nadu'),
  ('Tuticorin (Thoothukudi)', 'IN-TN', 'Tamil Nadu')
ON CONFLICT (name, state_name) DO NOTHING;

-- Karnataka Cities
INSERT INTO public.cities (name, state_id, state_name) VALUES
  ('Bengaluru', 'IN-KA', 'Karnataka'),
  ('Mysuru', 'IN-KA', 'Karnataka'),
  ('Mangaluru', 'IN-KA', 'Karnataka'),
  ('Hubballi-Dharwad', 'IN-KA', 'Karnataka'),
  ('Belagavi', 'IN-KA', 'Karnataka'),
  ('Shivamogga', 'IN-KA', 'Karnataka'),
  ('Kalaburagi', 'IN-KA', 'Karnataka'),
  ('Ballari', 'IN-KA', 'Karnataka'),
  ('Davangere', 'IN-KA', 'Karnataka'),
  ('Manipal', 'IN-KA', 'Karnataka'),
  ('Udupi', 'IN-KA', 'Karnataka'),
  ('Tumakuru', 'IN-KA', 'Karnataka')
ON CONFLICT (name, state_name) DO NOTHING;

-- Kerala Cities
INSERT INTO public.cities (name, state_id, state_name) VALUES
  ('Thiruvananthapuram', 'IN-KL', 'Kerala'),
  ('Kochi', 'IN-KL', 'Kerala'),
  ('Kozhikode', 'IN-KL', 'Kerala'),
  ('Thrissur', 'IN-KL', 'Kerala'),
  ('Kollam', 'IN-KL', 'Kerala'),
  ('Palakkad', 'IN-KL', 'Kerala'),
  ('Kannur', 'IN-KL', 'Kerala'),
  ('Kottayam', 'IN-KL', 'Kerala'),
  ('Alappuzha', 'IN-KL', 'Kerala'),
  ('Malappuram', 'IN-KL', 'Kerala')
ON CONFLICT (name, state_name) DO NOTHING;

-- Maharashtra Cities
INSERT INTO public.cities (name, state_id, state_name) VALUES
  ('Mumbai', 'IN-MH', 'Maharashtra'),
  ('Pune', 'IN-MH', 'Maharashtra'),
  ('Nagpur', 'IN-MH', 'Maharashtra'),
  ('Nashik', 'IN-MH', 'Maharashtra'),
  ('Thane', 'IN-MH', 'Maharashtra'),
  ('Navi Mumbai', 'IN-MH', 'Maharashtra'),
  ('Aurangabad (Chhatrapati Sambhajinagar)', 'IN-MH', 'Maharashtra'),
  ('Solapur', 'IN-MH', 'Maharashtra'),
  ('Kolhapur', 'IN-MH', 'Maharashtra')
ON CONFLICT (name, state_name) DO NOTHING;

-- Telangana Cities
INSERT INTO public.cities (name, state_id, state_name) VALUES
  ('Hyderabad', 'IN-TG', 'Telangana'),
  ('Warangal', 'IN-TG', 'Telangana'),
  ('Nizamabad', 'IN-TG', 'Telangana'),
  ('Karimnagar', 'IN-TG', 'Telangana'),
  ('Khammam', 'IN-TG', 'Telangana')
ON CONFLICT (name, state_name) DO NOTHING;

-- Andhra Pradesh Cities
INSERT INTO public.cities (name, state_id, state_name) VALUES
  ('Visakhapatnam', 'IN-AP', 'Andhra Pradesh'),
  ('Vijayawada', 'IN-AP', 'Andhra Pradesh'),
  ('Guntur', 'IN-AP', 'Andhra Pradesh'),
  ('Nellore', 'IN-AP', 'Andhra Pradesh'),
  ('Kurnool', 'IN-AP', 'Andhra Pradesh'),
  ('Tirupati', 'IN-AP', 'Andhra Pradesh'),
  ('Kakinada', 'IN-AP', 'Andhra Pradesh'),
  ('Rajahmundry', 'IN-AP', 'Andhra Pradesh')
ON CONFLICT (name, state_name) DO NOTHING;

-- Delhi Cities
INSERT INTO public.cities (name, state_id, state_name) VALUES
  ('New Delhi', 'IN-DL', 'Delhi'),
  ('Central Delhi', 'IN-DL', 'Delhi'),
  ('South Delhi', 'IN-DL', 'Delhi'),
  ('North Delhi', 'IN-DL', 'Delhi'),
  ('East Delhi', 'IN-DL', 'Delhi'),
  ('West Delhi', 'IN-DL', 'Delhi')
ON CONFLICT (name, state_name) DO NOTHING;

-- Uttar Pradesh Cities
INSERT INTO public.cities (name, state_id, state_name) VALUES
  ('Noida', 'IN-UP', 'Uttar Pradesh'),
  ('Greater Noida', 'IN-UP', 'Uttar Pradesh'),
  ('Lucknow', 'IN-UP', 'Uttar Pradesh'),
  ('Kanpur', 'IN-UP', 'Uttar Pradesh'),
  ('Varanasi', 'IN-UP', 'Uttar Pradesh'),
  ('Agra', 'IN-UP', 'Uttar Pradesh'),
  ('Prayagraj', 'IN-UP', 'Uttar Pradesh'),
  ('Ghaziabad', 'IN-UP', 'Uttar Pradesh')
ON CONFLICT (name, state_name) DO NOTHING;

-- 6. Seed Colleges with Location Mappings
INSERT INTO public.colleges (name, city, state, state_id) VALUES
  ('PSG College of Technology', 'Coimbatore', 'Tamil Nadu', 'IN-TN'),
  ('PSG Institute of Technology and Applied Research', 'Coimbatore', 'Tamil Nadu', 'IN-TN'),
  ('Coimbatore Institute of Technology (CIT)', 'Coimbatore', 'Tamil Nadu', 'IN-TN'),
  ('Kumaraguru College of Technology (KCT)', 'Coimbatore', 'Tamil Nadu', 'IN-TN'),
  ('Government College of Technology (GCT)', 'Coimbatore', 'Tamil Nadu', 'IN-TN'),
  ('Sri Krishna College of Engineering & Technology (SKCET)', 'Coimbatore', 'Tamil Nadu', 'IN-TN'),
  ('Sri Krishna College of Technology (SKCT)', 'Coimbatore', 'Tamil Nadu', 'IN-TN'),
  ('Bannari Amman Institute of Technology', 'Sathyamangalam', 'Tamil Nadu', 'IN-TN'),
  ('Karpagam College of Engineering', 'Coimbatore', 'Tamil Nadu', 'IN-TN'),
  ('Hindusthan College of Engineering and Technology', 'Coimbatore', 'Tamil Nadu', 'IN-TN'),
  ('College of Engineering, Guindy (CEG Anna University)', 'Chennai', 'Tamil Nadu', 'IN-TN'),
  ('Madras Institute of Technology (MIT Anna University)', 'Chennai', 'Tamil Nadu', 'IN-TN'),
  ('Alagappa College of Technology (ACT Anna University)', 'Chennai', 'Tamil Nadu', 'IN-TN'),
  ('Indian Institute of Technology Madras (IIT Madras)', 'Chennai', 'Tamil Nadu', 'IN-TN'),
  ('SSN College of Engineering', 'Chennai', 'Tamil Nadu', 'IN-TN'),
  ('Chennai Institute of Technology (CIT Chennai)', 'Chennai', 'Tamil Nadu', 'IN-TN'),
  ('Rajalakshmi Engineering College (REC)', 'Chennai', 'Tamil Nadu', 'IN-TN'),
  ('Sri Venkateswara College of Engineering (SVCE)', 'Sriperumbudur', 'Tamil Nadu', 'IN-TN'),
  ('St. Joseph''s College of Engineering', 'Chennai', 'Tamil Nadu', 'IN-TN'),
  ('Sathyabama Institute of Science and Technology', 'Chennai', 'Tamil Nadu', 'IN-TN'),
  ('National Institute of Technology Tiruchirappalli (NIT Trichy)', 'Tiruchirappalli', 'Tamil Nadu', 'IN-TN'),
  ('SASTRA Deemed University', 'Thanjavur', 'Tamil Nadu', 'IN-TN'),
  ('Thiagarajar College of Engineering (TCE)', 'Madurai', 'Tamil Nadu', 'IN-TN'),
  ('Vellore Institute of Technology (VIT)', 'Vellore', 'Tamil Nadu', 'IN-TN'),
  ('SRM Institute of Science and Technology', 'Kattankulathur', 'Tamil Nadu', 'IN-TN'),
  ('Amrita Vishwa Vidyapeetham', 'Coimbatore', 'Tamil Nadu', 'IN-TN'),
  ('Kongu Engineering College', 'Erode', 'Tamil Nadu', 'IN-TN'),
  ('Mepco Schlenk Engineering College', 'Sivakasi', 'Tamil Nadu', 'IN-TN'),
  ('Government College of Engineering, Salem', 'Salem', 'Tamil Nadu', 'IN-TN'),
  ('BITS Pilani', 'Pilani', 'Rajasthan', 'IN-RJ'),
  ('Indian Institute of Science (IISc)', 'Bengaluru', 'Karnataka', 'IN-KA'),
  ('IIT Bombay', 'Mumbai', 'Maharashtra', 'IN-MH'),
  ('IIT Delhi', 'New Delhi', 'Delhi', 'IN-DL'),
  ('IIT Kharagpur', 'Kharagpur', 'West Bengal', 'IN-WB'),
  ('IIT Kanpur', 'Kanpur', 'Uttar Pradesh', 'IN-UP'),
  ('IIT Roorkee', 'Roorkee', 'Uttarakhand', 'IN-UT'),
  ('IIT Hyderabad', 'Hyderabad', 'Telangana', 'IN-TG'),
  ('NIT Surathkal', 'Mangaluru', 'Karnataka', 'IN-KA'),
  ('NIT Calicut', 'Kozhikode', 'Kerala', 'IN-KL'),
  ('IIIT Hyderabad', 'Hyderabad', 'Telangana', 'IN-TG'),
  ('IIIT Bangalore', 'Bengaluru', 'Karnataka', 'IN-KA'),
  ('Delhi Technological University (DTU)', 'New Delhi', 'Delhi', 'IN-DL'),
  ('Netaji Subhas University of Technology (NSUT)', 'New Delhi', 'Delhi', 'IN-DL')
ON CONFLICT (name) DO UPDATE SET city = EXCLUDED.city, state = EXCLUDED.state;
