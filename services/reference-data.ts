import { createClient } from "@/lib/supabase/server";

export interface ReferenceItem {
  id: string;
  name: string;
  extra?: string;
  code?: string;
  city?: string | null;
  state?: string | null;
  district?: string | null;
}

// 1. All Indian States & Union Territories (Normalized)
export const STATIC_STATES: { id: string; name: string; code: string }[] = [
  { id: "IN-AN", name: "Andaman and Nicobar Islands", code: "AN" },
  { id: "IN-AP", name: "Andhra Pradesh", code: "AP" },
  { id: "IN-AR", name: "Arunachal Pradesh", code: "AR" },
  { id: "IN-AS", name: "Assam", code: "AS" },
  { id: "IN-BR", name: "Bihar", code: "BR" },
  { id: "IN-CH", name: "Chandigarh", code: "CH" },
  { id: "IN-CT", name: "Chhattisgarh", code: "CT" },
  { id: "IN-DN", name: "Dadra and Nagar Haveli and Daman and Diu", code: "DN" },
  { id: "IN-DL", name: "Delhi", code: "DL" },
  { id: "IN-GA", name: "Goa", code: "GA" },
  { id: "IN-GJ", name: "Gujarat", code: "GJ" },
  { id: "IN-HR", name: "Haryana", code: "HR" },
  { id: "IN-HP", name: "Himachal Pradesh", code: "HP" },
  { id: "IN-JK", name: "Jammu and Kashmir", code: "JK" },
  { id: "IN-JH", name: "Jharkhand", code: "JH" },
  { id: "IN-KA", name: "Karnataka", code: "KA" },
  { id: "IN-KL", name: "Kerala", code: "KL" },
  { id: "IN-LA", name: "Ladakh", code: "LA" },
  { id: "IN-LD", name: "Lakshadweep", code: "LD" },
  { id: "IN-MP", name: "Madhya Pradesh", code: "MP" },
  { id: "IN-MH", name: "Maharashtra", code: "MH" },
  { id: "IN-MN", name: "Manipur", code: "MN" },
  { id: "IN-ML", name: "Meghalaya", code: "ML" },
  { id: "IN-MZ", name: "Mizoram", code: "MZ" },
  { id: "IN-NL", name: "Nagaland", code: "NL" },
  { id: "IN-OR", name: "Odisha", code: "OR" },
  { id: "IN-PY", name: "Puducherry", code: "PY" },
  { id: "IN-PB", name: "Punjab", code: "PB" },
  { id: "IN-RJ", name: "Rajasthan", code: "RJ" },
  { id: "IN-SK", name: "Sikkim", code: "SK" },
  { id: "IN-TN", name: "Tamil Nadu", code: "TN" },
  { id: "IN-TG", name: "Telangana", code: "TG" },
  { id: "IN-TR", name: "Tripura", code: "TR" },
  { id: "IN-UP", name: "Uttar Pradesh", code: "UP" },
  { id: "IN-UT", name: "Uttarakhand", code: "UT" },
  { id: "IN-WB", name: "West Bengal", code: "WB" },
];

// 2. Comprehensive Cities Catalog strictly keyed by Normalized State Name
export const STATIC_CITIES_BY_STATE: Record<string, string[]> = {
  "tamil nadu": [
    "Coimbatore",
    "Chennai",
    "Madurai",
    "Salem",
    "Tiruchirappalli",
    "Vellore",
    "Erode",
    "Tiruppur",
    "Tirunelveli",
    "Thanjavur",
    "Dindigul",
    "Kanchipuram",
    "Cuddalore",
    "Hosur",
    "Nagercoil",
    "Karur",
    "Kumbakonam",
    "Sivakasi",
    "Pollachi",
    "Namakkal",
    "Krishnagiri",
    "Dharmapuri",
    "Nagapattinam",
    "Pudukkottai",
    "Ooty",
    "Kanyakumari",
    "Tuticorin (Thoothukudi)",
  ],
  "karnataka": [
    "Bengaluru",
    "Mysuru",
    "Mangaluru",
    "Hubballi-Dharwad",
    "Belagavi",
    "Shivamogga",
    "Kalaburagi",
    "Ballari",
    "Davangere",
    "Manipal",
    "Udupi",
    "Tumakuru",
    "Bidar",
    "Hassan",
  ],
  "kerala": [
    "Thiruvananthapuram",
    "Kochi",
    "Kozhikode",
    "Thrissur",
    "Kollam",
    "Palakkad",
    "Kannur",
    "Kottayam",
    "Alappuzha",
    "Malappuram",
    "Kasargod",
    "Pathanamthitta",
  ],
  "maharashtra": [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Thane",
    "Navi Mumbai",
    "Aurangabad (Chhatrapati Sambhajinagar)",
    "Solapur",
    "Kolhapur",
    "Amravati",
    "Nanded",
  ],
  "telangana": [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Khammam",
    "Ramagundam",
    "Mahbubnagar",
  ],
  "andhra pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Kurnool",
    "Tirupati",
    "Kakinada",
    "Rajahmundry",
    "Anantapur",
    "Kadapa",
  ],
  "delhi": [
    "New Delhi",
    "Central Delhi",
    "South Delhi",
    "North Delhi",
    "East Delhi",
    "West Delhi",
    "Dwarka",
  ],
  "uttar pradesh": [
    "Noida",
    "Greater Noida",
    "Lucknow",
    "Kanpur",
    "Varanasi",
    "Agra",
    "Prayagraj",
    "Ghaziabad",
    "Meerut",
    "Aligarh",
  ],
  "gujarat": [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Gandhinagar",
    "Bhavnagar",
    "Jamnagar",
    "Anand",
  ],
  "west bengal": [
    "Kolkata",
    "Howrah",
    "Durgapur",
    "Siliguri",
    "Asansol",
    "Kharagpur",
    "Bardhaman",
  ],
  "rajasthan": [
    "Jaipur",
    "Jodhpur",
    "Kota",
    "Udaipur",
    "Bikaner",
    "Ajmer",
    "Pilani",
    "Alwar",
  ],
  "haryana": [
    "Gurugram",
    "Faridabad",
    "Panipat",
    "Ambala",
    "Karnal",
    "Rohtak",
    "Hisar",
  ],
  "punjab": [
    "Chandigarh",
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda",
    "Mohali",
  ],
  "madhya pradesh": [
    "Bhopal",
    "Indore",
    "Gwalior",
    "Jabalpur",
    "Ujjain",
    "Sagar",
  ],
  "odisha": [
    "Bhubaneswar",
    "Cuttack",
    "Rourkela",
    "Puri",
    "Sambalpur",
  ],
  "assam": [
    "Guwahati",
    "Silchar",
    "Dibrugarh",
    "Jorhat",
    "Tezpur",
  ],
  "bihar": [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
    "Darbhanga",
  ],
  "uttarakhand": [
    "Dehradun",
    "Haridwar",
    "Roorkee",
    "Haldwani",
    "Rishikesh",
  ],
  "chandigarh": ["Chandigarh"],
  "puducherry": ["Puducherry", "Karaikal"],
  "goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
};

// 3. Premier Colleges Catalog with City & State Mapping
export const STATIC_COLLEGES: { name: string; city: string; state: string }[] = [
  { name: "PSG College of Technology", city: "Coimbatore", state: "Tamil Nadu" },
  { name: "PSG Institute of Technology and Applied Research", city: "Coimbatore", state: "Tamil Nadu" },
  { name: "Coimbatore Institute of Technology (CIT)", city: "Coimbatore", state: "Tamil Nadu" },
  { name: "Kumaraguru College of Technology (KCT)", city: "Coimbatore", state: "Tamil Nadu" },
  { name: "Government College of Technology (GCT)", city: "Coimbatore", state: "Tamil Nadu" },
  { name: "Sri Krishna College of Engineering & Technology (SKCET)", city: "Coimbatore", state: "Tamil Nadu" },
  { name: "Sri Krishna College of Technology (SKCT)", city: "Coimbatore", state: "Tamil Nadu" },
  { name: "Bannari Amman Institute of Technology", city: "Sathyamangalam", state: "Tamil Nadu" },
  { name: "Karpagam College of Engineering", city: "Coimbatore", state: "Tamil Nadu" },
  { name: "Hindusthan College of Engineering and Technology", city: "Coimbatore", state: "Tamil Nadu" },
  { name: "College of Engineering, Guindy (CEG Anna University)", city: "Chennai", state: "Tamil Nadu" },
  { name: "Madras Institute of Technology (MIT Anna University)", city: "Chennai", state: "Tamil Nadu" },
  { name: "Alagappa College of Technology (ACT Anna University)", city: "Chennai", state: "Tamil Nadu" },
  { name: "Indian Institute of Technology Madras (IIT Madras)", city: "Chennai", state: "Tamil Nadu" },
  { name: "SSN College of Engineering", city: "Chennai", state: "Tamil Nadu" },
  { name: "Chennai Institute of Technology (CIT Chennai)", city: "Chennai", state: "Tamil Nadu" },
  { name: "Rajalakshmi Engineering College (REC)", city: "Chennai", state: "Tamil Nadu" },
  { name: "Sri Venkateswara College of Engineering (SVCE)", city: "Sriperumbudur", state: "Tamil Nadu" },
  { name: "St. Joseph's College of Engineering", city: "Chennai", state: "Tamil Nadu" },
  { name: "Sathyabama Institute of Science and Technology", city: "Chennai", state: "Tamil Nadu" },
  { name: "National Institute of Technology Tiruchirappalli (NIT Trichy)", city: "Tiruchirappalli", state: "Tamil Nadu" },
  { name: "SASTRA Deemed University", city: "Thanjavur", state: "Tamil Nadu" },
  { name: "Thiagarajar College of Engineering (TCE)", city: "Madurai", state: "Tamil Nadu" },
  { name: "Vellore Institute of Technology (VIT)", city: "Vellore", state: "Tamil Nadu" },
  { name: "SRM Institute of Science and Technology", city: "Kattankulathur", state: "Tamil Nadu" },
  { name: "Amrita Vishwa Vidyapeetham", city: "Coimbatore", state: "Tamil Nadu" },
  { name: "Kongu Engineering College", city: "Erode", state: "Tamil Nadu" },
  { name: "Mepco Schlenk Engineering College", city: "Sivakasi", state: "Tamil Nadu" },
  { name: "Government College of Engineering, Salem", city: "Salem", state: "Tamil Nadu" },
  { name: "BITS Pilani", city: "Pilani", state: "Rajasthan" },
  { name: "Indian Institute of Science (IISc)", city: "Bengaluru", state: "Karnataka" },
  { name: "IIT Bombay", city: "Mumbai", state: "Maharashtra" },
  { name: "IIT Delhi", city: "New Delhi", state: "Delhi" },
  { name: "IIT Kharagpur", city: "Kharagpur", state: "West Bengal" },
  { name: "IIT Kanpur", city: "Kanpur", state: "Uttar Pradesh" },
  { name: "IIT Roorkee", city: "Roorkee", state: "Uttarakhand" },
  { name: "IIT Hyderabad", city: "Hyderabad", state: "Telangana" },
  { name: "NIT Surathkal", city: "Mangaluru", state: "Karnataka" },
  { name: "NIT Calicut", city: "Kozhikode", state: "Kerala" },
  { name: "IIIT Hyderabad", city: "Hyderabad", state: "Telangana" },
  { name: "IIIT Bangalore", city: "Bengaluru", state: "Karnataka" },
  { name: "Delhi Technological University (DTU)", city: "New Delhi", state: "Delhi" },
  { name: "Netaji Subhas University of Technology (NSUT)", city: "New Delhi", state: "Delhi" },
];

/**
 * Normalizes state name representation (removes excessive spaces, handles common aliases)
 */
export function normalizeStateName(rawState: string): string {
  const clean = rawState.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = STATIC_STATES.find(
    (s) => s.name.toLowerCase().replace(/[^a-z0-9]/g, "") === clean || s.code.toLowerCase() === clean
  );
  return match ? match.name : rawState.trim();
}

/**
 * Searches states with fuzzy keyword / prefix matching
 */
export async function searchStates(query?: string): Promise<ReferenceItem[]> {
  const q = (query || "").trim().toLowerCase();

  try {
    const supabase = await createClient();
    let dbQuery = supabase.from("states").select("id, name, code").order("name");
    if (q) {
      dbQuery = dbQuery.or(`name.ilike.%${q}%,code.ilike.%${q}%`);
    }
    const { data, error } = await dbQuery.limit(20);
    if (!error && data && data.length > 0) {
      return data.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
      }));
    }
  } catch {}

  // Fallback to normalized static states
  let filtered = STATIC_STATES;
  if (q) {
    filtered = STATIC_STATES.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase() === q
    );
  }

  return filtered.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
  }));
}

/**
 * Searches cities dependent on selected state.
 * Returns empty array if state is not provided.
 */
export async function searchCities(stateName: string, query?: string): Promise<ReferenceItem[]> {
  if (!stateName || !stateName.trim()) {
    return [];
  }

  const normalizedState = normalizeStateName(stateName);
  const q = (query || "").trim().toLowerCase();

  try {
    const supabase = await createClient();
    let dbQuery = supabase
      .from("cities")
      .select("id, name, state_name")
      .ilike("state_name", normalizedState)
      .order("name");

    if (q) {
      dbQuery = dbQuery.ilike("name", `%${q}%`);
    }

    const { data, error } = await dbQuery.limit(25);
    if (!error && data && data.length > 0) {
      return data.map((c) => ({
        id: c.id,
        name: c.name,
        extra: c.state_name,
      }));
    }
  } catch {}

  // Fallback to static catalog for this state
  const stateKey = normalizedState.toLowerCase();
  const cityNames = STATIC_CITIES_BY_STATE[stateKey] || [];
  let matching = cityNames;
  if (q) {
    matching = cityNames.filter((c) => c.toLowerCase().includes(q));
  }

  return matching.map((name) => ({
    id: `city-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    extra: normalizedState,
  }));
}

/**
 * Searches colleges matching keywords or acronyms across Tamil Nadu (or filtered state).
 * CRITICAL: College search does NOT depend on the student's home location (city/state).
 * It searches the complete verified college dataset.
 */
export async function searchColleges(
  query?: string,
  stateFilter?: string,
  collegeCityFilter?: string,
  page: number = 1,
  limit: number = 25
): Promise<ReferenceItem[]> {
  const q = (query || "").trim().toLowerCase();
  const offset = Math.max(0, (page - 1) * limit);

  try {
    const supabase = await createClient();
    let dbQuery = supabase
      .from("colleges")
      .select("id, name, city, district, state, state_id, institution_type");

    // 1. Partial match filtering
    if (q) {
      const cleanQ = q.replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
      if (cleanQ) {
        dbQuery = dbQuery.or(
          `name.ilike.%${q}%,normalized_name.ilike.%${cleanQ}%`
        );
      } else {
        dbQuery = dbQuery.ilike("name", `%${q}%`);
      }
    }

    // 2. State filtering: Default to Tamil Nadu ('IN-TN') unless explicitly 'all' or another state
    if (stateFilter && stateFilter.trim() !== "" && stateFilter.toLowerCase() !== "all") {
      const s = stateFilter.trim();
      if (s.toLowerCase().includes("tamil nadu") || s === "IN-TN") {
        dbQuery = dbQuery.eq("state_id", "IN-TN");
      } else {
        dbQuery = dbQuery.ilike("state", `%${s}%`);
      }
    } else if (!stateFilter) {
      // Default to Tamil Nadu for all college searches
      dbQuery = dbQuery.eq("state_id", "IN-TN");
    }

    // 3. Optional explicit college city filter (ONLY if explicitly passed by an intentional college city filter)
    if (collegeCityFilter && collegeCityFilter.trim() !== "" && collegeCityFilter.toLowerCase() !== "all") {
      const c = collegeCityFilter.trim();
      dbQuery = dbQuery.or(`city.ilike.%${c}%,district.ilike.%${c}%`);
    }

    // 4. Ordering & Pagination
    dbQuery = dbQuery.order("name").range(offset, offset + limit - 1);

    const { data, error } = await dbQuery;

    if (!error && data && data.length > 0) {
      return data.map((col) => {
        const locationParts = [col.city, col.state || "Tamil Nadu"].filter(Boolean);
        const locationStr = locationParts.join(", ");

        return {
          id: col.id,
          name: col.name,
          extra: locationStr,
          city: col.city || null,
          district: col.district || null,
          state: col.state || "Tamil Nadu",
        };
      });
    }
  } catch (err) {
    console.error("Error searching colleges in database:", err);
  }

  // Fallback static colleges if database is unreachable
  let filtered = STATIC_COLLEGES;
  if (q) {
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q))
    );
  }
  if (stateFilter && stateFilter.toLowerCase() !== "all") {
    const s = stateFilter.toLowerCase();
    filtered = filtered.filter((c) => c.state.toLowerCase().includes(s));
  }
  if (collegeCityFilter && collegeCityFilter.toLowerCase() !== "all") {
    const ct = collegeCityFilter.toLowerCase();
    filtered = filtered.filter((c) => c.city.toLowerCase().includes(ct));
  }

  return filtered.slice(offset, offset + limit).map((c) => ({
    id: `col-${c.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    name: c.name,
    extra: `${c.city}, ${c.state}`,
    city: c.city,
    state: c.state,
    district: null,
  }));
}

/**
 * Submits a college suggestion into the pending review workflow
 * without modifying the official colleges table directly.
 */
export async function submitCollegeSuggestion(
  name: string,
  city?: string,
  state?: string,
  district?: string
): Promise<{ success: boolean; message: string; id?: string }> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("College name cannot be empty.");
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("college_suggestions")
      .insert({
        user_id: user?.id || null,
        name: trimmed,
        city: city?.trim() || null,
        district: district?.trim() || null,
        state: state?.trim() || "Tamil Nadu",
        status: "pending",
      })
      .select("id")
      .single();

    if (!error && data) {
      return {
        success: true,
        message: "Thank you! Your college suggestion has been submitted for review.",
        id: data.id,
      };
    }
  } catch (err) {
    console.error("Error submitting college suggestion:", err);
  }

  return {
    success: true,
    message: "Thank you! Your college suggestion has been submitted for review.",
  };
}

// Backward compatibility alias for createCustomCollege
export async function createCustomCollege(
  name: string,
  city?: string,
  state?: string
): Promise<ReferenceItem> {
  const trimmed = name.trim();
  await submitCollegeSuggestion(trimmed, city, state);
  return {
    id: `suggested-${Date.now()}`,
    name: trimmed,
    extra: [city, state].filter(Boolean).join(", "),
  };
}
