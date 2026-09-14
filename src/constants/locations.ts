export interface CityLocation {
  city: string;
  district: string;
  state: string;
}

export const INDIA_LOCATIONS: { [stateName: string]: { [districtName: string]: string[] } } = {
  "Andhra Pradesh": {
    "Visakhapatnam": ["Visakhapatnam", "MVP Colony", "Gajuwaka", "Madhurawada", "Beach Road", "Pendurthi"],
    "Krishna": ["Vijayawada", "Benz Circle", "MG Road", "Gannavaram", "Governorpet", "Machilipatnam"],
    "Guntur": ["Guntur", "Amaravati", "Mangalagiri", "Tenali", "Narasaraopet"],
    "Chittoor": ["Tirupati", "Alipiri", "Tirumala", "Chittoor", "Madanapalle", "Srikalahasti"],
    "East Godavari": ["Kakinada", "Rajahmundry", "Amalapuram", "Samalkota"],
    "West Godavari": ["Eluru", "Bhimavaram", "Tadepalligudem", "Palakollu"],
    "Kurnool": ["Kurnool", "Nandyal", "Adoni", "Yemmiganur"],
    "Nellore": ["Nellore", "Kavali", "Gudur", "Venkatagiri"]
  },
  "Arunachal Pradesh": {
    "Papum Pare": ["Itanagar", "Naharlagun", "Doimukh", "Yupia"],
    "Tawang": ["Tawang", "Jang", "Lumla"],
    "West Kameng": ["Bomdila", "Dirang", "Rupa"],
    "Changlang": ["Changlang", "Miao", "Jairampur"]
  },
  "Assam": {
    "Kamrup Metropolitan": ["Guwahati", "Dispur", "GS Road", "Paltan Bazaar", "Zoo Road", "Pan Bazaar", "Jalukbari"],
    "Dibrugarh": ["Dibrugarh", "Chowkidinghee", "Graham Bazar", "Naharkatia"],
    "Cachar": ["Silchar", "Tarapur", "Rangirkhari", "Meherpur"],
    "Jorhat": ["Jorhat", "Gar-Ali", "Rowriah", "Titabar"],
    "Nagaon": ["Nagaon", "Haibargaon", "Dhing", "Koliabor"],
    "Sonitpur": ["Tezpur", "Mission Chariali", "Dhekiajuli"]
  },
  "Bihar": {
    "Patna": ["Patna", "Boring Road", "Kankarbagh", "Bailey Road", "Danapur", "Patliputra", "Rajendra Nagar"],
    "Gaya": ["Gaya", "Bodh Gaya", "Civil Lines", "AP Colony"],
    "Bhagalpur": ["Bhagalpur", "Tilka Manjhi", "Zero Mile", "Nathnagar"],
    "Muzaffarpur": ["Muzaffarpur", "Motijheel", "Mithanpura", "Brahmpura"],
    "Darbhanga": ["Darbhanga", "Laheriasarai", "Lalbagh"],
    "Purnia": ["Purnia", "Line Bazar", "Gulabbagh", "Bhatta Bazar"]
  },
  "Chandigarh (UT)": {
    "Chandigarh": ["Sector 17", "Sector 35", "Sector 22", "Sector 8", "Sector 9", "Sector 26", "Sector 43", "Manimajra"]
  },
  "Chhattisgarh": {
    "Raipur": ["Raipur", "Pandri", "Telibandha", "Shankar Nagar", "Devendra Nagar", "Naya Raipur"],
    "Durg": ["Bhilai", "Durg", "Supela", "Nehru Nagar", "Sector 6"],
    "Bilaspur": ["Bilaspur", "Vyapar Vihar", "Civil Lines", "Rajkishore Nagar"],
    "Korba": ["Korba", "Transport Nagar", "TP Nagar", "Balco"],
    "Rajnandgaon": ["Rajnandgaon", "Chikhali", "Dongargarh"]
  },
  "Delhi (NCR)": {
    "New Delhi": ["Connaught Place", "Chanakyapuri", "Barakhamba", "Gole Market"],
    "South Delhi": ["Hauz Khas", "Saket", "Greater Kailash", "Nehru Place", "Lajpat Nagar", "Green Park", "South Extension"],
    "South West Delhi": ["Vasant Kunj", "Dwarka", "Janakpuri", "Vasant Vihar", "Delhi Cantt"],
    "North Delhi": ["Civil Lines", "Kamla Nagar", "Model Town", "Kashmere Gate"],
    "East Delhi": ["Preet Vihar", "Mayur Vihar", "Laxmi Nagar", "Anand Vihar", "Patparganj"],
    "West Delhi": ["Rajouri Garden", "Punjabi Bagh", "Tilak Nagar", "Paschim Vihar", "Patel Nagar"],
    "Central Delhi": ["Karol Bagh", "Pahar Ganj", "Daryaganj", "Rajender Nagar"]
  },
  "Goa": {
    "North Goa": ["Panaji", "Candolim", "Calangute", "Anjuna", "Assagao", "Mapusa", "Porvorim", "Vagator"],
    "South Goa": ["Margao", "Vasco da Gama", "Colva", "Benaulim", "Ponda", "Cavelossim"]
  },
  "Gujarat": {
    "Ahmedabad": ["Ahmedabad", "Navrangpura", "SG Highway", "Bodakdev", "Prahlad Nagar", "Satellite", "Vastrapur", "Maninagar"],
    "Surat": ["Surat", "Vesu", "Adajan", "Ring Road", "Piplod", "Varachha", "Katargam"],
    "Vadodara": ["Vadodara", "Alkapuri", "Race Course", "Gotri", "Sayajigunj", "Manjalpur"],
    "Rajkot": ["Rajkot", "Kalavad Road", "Yagnik Road", "University Road", "150 Feet Ring Road"],
    "Gandhinagar": ["Gandhinagar", "Infocity", "Kudasan", "Sector 11", "Sector 21", "GIFT City"],
    "Bhavnagar": ["Bhavnagar", "Waghawadi Road", "Kalanala", "Ghogha Circle"],
    "Jamnagar": ["Jamnagar", "Digjam Circle", "Pandit Nehru Marg", "Patel Colony"]
  },
  "Haryana": {
    "Gurugram": ["Gurgaon", "Cyber City", "Golf Course Road", "DLF Phase 1", "DLF Phase 5", "Sohna Road", "Sector 29", "MG Road"],
    "Faridabad": ["Faridabad", "Sector 15", "Sector 16", "NIT Faridabad", "Greenfield Colony"],
    "Panipat": ["Panipat", "Model Town", "Sector 11", "GT Road"],
    "Ambala": ["Ambala Cantt", "Ambala City", "Model Town", "Cloth Market"],
    "Karnal": ["Karnal", "Model Town", "Sector 13", "Mughal Canal"],
    "Panchkula": ["Panchkula", "Sector 5", "Sector 20", "Sector 7", "MDC"]
  },
  "Himachal Pradesh": {
    "Shimla": ["Shimla", "Mall Road", "Sanjauli", "Chotta Shimla", "Kufri", "Summer Hill"],
    "Kangra": ["Dharamshala", "McLeod Ganj", "Kangra", "Palampur"],
    "Kullu": ["Manali", "Kullu", "Old Manali", "Naggar", "Kasol"],
    "Solan": ["Solan", "Kasauli", "Barog", "Baddi"],
    "Mandi": ["Mandi", "Sundernagar", "Rewalsar"]
  },
  "Jammu & Kashmir (UT)": {
    "Srinagar": ["Srinagar", "Lal Chowk", "Rajbagh", "Dal Gate", "Karan Nagar", "Hyderpora", "Hazratbal"],
    "Jammu": ["Jammu", "Gandhi Nagar", "Channi Himmat", "Trikuta Nagar", "Bahu Fort", "Talab Tillo"],
    "Anantnag": ["Anantnag", "Pahalgam", "KP Road", "Mattan"],
    "Baramulla": ["Baramulla", "Gulmarg", "Tangmarg", "Sopore"]
  },
  "Jharkhand": {
    "Ranchi": ["Ranchi", "Main Road", "Kanke Road", "Harmu", "Doranda", "Lalpur", "Hinoo"],
    "East Singhbhum": ["Jamshedpur", "Bistupur", "Sakchi", "Kadma", "Sonari", "Telco"],
    "Dhanbad": ["Dhanbad", "Bank More", "Saraidhela", "Hirapur", "Jharia"],
    "Bokaro": ["Bokaro Steel City", "Sector 4", "Chas", "Sector 1"],
    "Hazaribagh": ["Hazaribagh", "Korra", "Matwari", "Guru Gobind Singh Road"]
  },
  "Karnataka": {
    "Bengaluru Urban": ["Bangalore", "Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Jayanagar", "JP Nagar", "Marathahalli", "Electronic City", "Malleshwaram", "Hebbal", "Yelahanka", "MG Road"],
    "Bengaluru Rural": ["Doddaballapura", "Devanahalli", "Nelamangala", "Hosakote"],
    "Mysuru": ["Mysore", "Gokulam", "Vijayanagar", "Jayalakshmipuram", "Saraswathipuram", "Kuvempunagar"],
    "Dakshina Kannada": ["Mangalore", "Surathkal", "Kadri", "Kodialbail", "Bejai", "Ullal"],
    "Dharwad": ["Hubli", "Dharwad", "Vidyanagar", "Gokul Road", "Keshwapur"],
    "Belagavi": ["Belgaum", "Tilakwadi", "Camp", "Khanapur Road"],
    "Udupi": ["Udupi", "Manipal", "Malpe", "Brahmavar"],
    "Shivamogga": ["Shimoga", "Vinoba Nagara", "Gopala Gowda Extension", "Bhadravati"]
  },
  "Kerala": {
    "Ernakulam": ["Kochi", "Edappally", "Fort Kochi", "Marine Drive", "Kakkanad", "Panampilly Nagar", "Aluva", "MG Road Kochi", "Palarivattom", "Vyttila"],
    "Thiruvananthapuram": ["Trivandrum", "Technopark", "Kowdiar", "Vazhuthacaud", "Pattom", "Kazhakkoottam", "East Fort"],
    "Kozhikode": ["Calicut", "Mavoor Road", "Beach Road", "Palayam", "Thondayad", "Karanthur"],
    "Thrissur": ["Thrissur", "Round West", "Swaraj Round", "Punkunnam", "Ayyanthole"],
    "Kannur": ["Kannur", "Thana", "Payyambalam", "Talap", "Thalassery"],
    "Kottayam": ["Kottayam", "Kanjikuzhy", "Baker Junction", "Pala", "Changanassery"],
    "Kollam": ["Kollam", "Chinnakada", "Asramam", "Kadappakada", "Karunagappally"],
    "Malappuram": ["Malappuram", "Manjeri", "Perinthalmanna", "Tirur", "Kottakkal"]
  },
  "Ladakh (UT)": {
    "Leh": ["Leh", "Choglamsar", "Shey", "Thiksey", "Nubra"],
    "Kargil": ["Kargil", "Drass", "Sanku"]
  },
  "Madhya Pradesh": {
    "Indore": ["Indore", "Vijay Nagar", "Palasia", "Bhawarkua", "AB Road", "Sapna Sangeeta", "Rajwada", "Rau"],
    "Bhopal": ["Bhopal", "MP Nagar", "Arera Colony", "Shahpura", "Kolar Road", "Hoshangabad Road"],
    "Gwalior": ["Gwalior", "City Center", "Lashkar", "Morar", "Thatipur"],
    "Jabalpur": ["Jabalpur", "Civil Lines", "Wright Town", "Napier Town", "Vijay Nagar"],
    "Ujjain": ["Ujjain", "Freeganj", "Mahakal Mandir Area", "Nanaji Deshmukh Marg"]
  },
  "Maharashtra": {
    "Mumbai City": ["Colaba", "Marine Drive", "Nariman Point", "Fort", "Dadar", "Worli", "Lower Parel", "Byculla"],
    "Mumbai Suburban": ["Mumbai", "Andheri", "Bandra", "Juhu", "Borivali", "Malad", "Powai", "Goregaon", "Kandivali", "Santacruz", "Vile Parle", "Ghatkopar", "Mulund", "Kurla"],
    "Thane": ["Thane", "Navi Mumbai", "Vashi", "Nerul", "Belapur", "Kalyan", "Dombivli", "Mira Road", "Bhayandar", "Kharghar", "Panvel"],
    "Pune": ["Pune", "Kothrud", "Hinjewadi", "Viman Nagar", "Baner", "Wakad", "Kalyani Nagar", "Aundh", "Hadapsar", "Magarpatta", "Pimpri-Chinchwad"],
    "Nagpur": ["Nagpur", "Dharampeth", "Sitabuldi", "Ramdaspeth", "Wardha Road", "Manish Nagar", "Hingna"],
    "Nashik": ["Nashik", "Panchavati", "Satpur", "College Road", "Gangapur Road", "Indira Nagar"],
    "Chhatrapati Sambhajinagar": ["Aurangabad", "CIDCO", "Waluj", "Cannaught Place", "Garkheda"],
    "Kolhapur": ["Kolhapur", "Tarabai Park", "Rajarampuri", "Shahupuri"],
    "Solapur": ["Solapur", "Hotgi Road", "Jule Solapur", "Saat Rasta"]
  },
  "Manipur": {
    "Imphal West": ["Imphal", "Thangal Bazar", "Paona Bazar", "Lamphelpat"],
    "Imphal East": ["Porompat", "Heingang", "Wangkhei"],
    "Churachandpur": ["Churachandpur", "Tuibong", "New Lamka"]
  },
  "Meghalaya": {
    "East Khasi Hills": ["Shillong", "Police Bazar", "Laitumkhrah", "Laban", "Mawkhar"],
    "West Garo Hills": ["Tura", "Hawakhana", "Araimile"]
  },
  "Mizoram": {
    "Aizawl": ["Aizawl", "Zarkawt", "Bawngkawn", "Chanmari", "Khatla"],
    "Lunglei": ["Lunglei", "Venglai", "Chanmari"]
  },
  "Nagaland": {
    "Kohima": ["Kohima", "Midlane", "High School Colony", "Razhu Point"],
    "Dimapur": ["Dimapur", "Nyamo Lotha Road", "Duncan Bosti", "Chumukedima"]
  },
  "Odisha": {
    "Khurda": ["Bhubaneswar", "Saheed Nagar", "Patia", "Nayapalli", "Jayadev Vihar", "Chandrasekharpur", "Khandagiri"],
    "Cuttack": ["Cuttack", "Badambadi", "College Square", "Buxi Bazaar", "CDA"],
    "Ganjam": ["Berhampur", "Bhabha Nagar", "Giri Market", "Gopalpur"],
    "Sundargarh": ["Rourkela", "Civil Township", "Sector 19", "Koel Nagar"],
    "Puri": ["Puri", "Grand Road", "VIP Road", "Sea Beach"]
  },
  "Puducherry (UT)": {
    "Puducherry": ["Pondicherry", "White Town", "Heritage Town", "Lawspet", "Muthialpet"],
    "Karaikal": ["Karaikal", "Nedungadu", "Kottucherry"]
  },
  "Punjab": {
    "Ludhiana": ["Ludhiana", "Model Town", "Gurdev Nagar", "Sarabha Nagar", "Ferozepur Road", "Civil Lines"],
    "Amritsar": ["Amritsar", "Mall Road", "Ranjit Avenue", "Lawrence Road", "Golden Temple Area"],
    "Jalandhar": ["Jalandhar", "Model Town", "Cantt Road", "Urban Estate", "Rama Mandi"],
    "SAS Nagar": ["Mohali", "Phase 3B2", "Phase 7", "Sector 70", "Sector 82"],
    "Patiala": ["Patiala", "Leela Bhawan", "Urban Estate", "YPS Market"],
    "Bathinda": ["Bathinda", "Model Town", "Civil Lines", "Mall Road"]
  },
  "Rajasthan": {
    "Jaipur": ["Jaipur", "C-Scheme", "Malviya Nagar", "Vaishali Nagar", "Raja Park", "Mansarovar", "Jagatpura", "Tonk Road"],
    "Jodhpur": ["Jodhpur", "Ratanada", "Shastri Nagar", "Sardarpura", "Pal Road"],
    "Udaipur": ["Udaipur", "Fatehpura", "Hiran Magri", "Panchwati", "Sukhadia Circle"],
    "Kota": ["Kota", "Vigyan Nagar", "Talwandi", "Gumanpura", "Rajeev Gandhi Nagar"],
    "Bikaner": ["Bikaner", "Kote Gate", "Rani Bazar", "Sadul Ganj"],
    "Ajmer": ["Ajmer", "Civil Lines", "Vaishali Nagar", "Panchsheel Nagar"]
  },
  "Sikkim": {
    "East Sikkim": ["Gangtok", "MG Marg", "Deorali", "Tadong"],
    "West Sikkim": ["Pelling", "Geyzing", "Yuksom"]
  },
  "Tamil Nadu": {
    "Chennai": ["Chennai", "Adyar", "T. Nagar", "Velachery", "Anna Nagar", "Besant Nagar", "Mylapore", "Nungambakkam", "Alwarpet", "OMR", "Porur", "Kilpauk", "Tambaram", "Guindy"],
    "Coimbatore": ["Coimbatore", "Peelamedu", "RS Puram", "Gandhipuram", "Saibaba Colony", "Saravanampatti", "Race Course"],
    "Madurai": ["Madurai", "KK Nagar", "Anna Nagar", "Simmakkal", "Tallakulam"],
    "Tiruchirappalli": ["Trichy", "Thillai Nagar", "Cantonment", "Srirangam", "K.K. Nagar"],
    "Salem": ["Salem", "Fairlands", "Hasthampatti", "Alagapuram", "Suramangalam"],
    "Tirunelveli": ["Tirunelveli", "Palayamkottai", "Vannarpettai", "Tirunelveli Town"],
    "Vellore": ["Vellore", "Katpadi", "Gandhi Nagar", "Sathuvachari"]
  },
  "Telangana": {
    "Hyderabad": ["Hyderabad", "Banjara Hills", "Jubilee Hills", "Gachibowli", "HITEC City", "Kondapur", "Madhapur", "Begumpet", "Somajiguda", "Secunderabad", "Ameerpet", "Kukatpally"],
    "Rangareddy": ["Manikonda", "Kokapet", "Narsingi", "Shamshabad", "Attapur", "Rajendranagar"],
    "Medchal-Malkajgiri": ["Kompally", "Malkajgiri", "Alwal", "Medchal", "Boduppal"],
    "Warangal": ["Warangal", "Hanamkonda", "Kazipet", "Subedari"],
    "Nizamabad": ["Nizamabad", "Khaleelwadi", "Bodhan Road"],
    "Karimnagar": ["Karimnagar", "Mukarrampura", "Kothapally"]
  },
  "Tripura": {
    "West Tripura": ["Agartala", "Banamalipur", "Radhanagar", "Arundhutinagar"],
    "Gomati": ["Udaipur", "Matabari", "Amarpur"]
  },
  "Uttar Pradesh": {
    "Gautam Buddha Nagar": ["Noida", "Greater Noida", "Sector 18", "Sector 62", "Sector 137", "Sector 75", "Knowledge Park"],
    "Ghaziabad": ["Ghaziabad", "Indirapuram", "Vaishali", "Vasundhara", "Raj Nagar", "Kaushambi"],
    "Lucknow": ["Lucknow", "Hazratganj", "Gomti Nagar", "Aliganj", "Indira Nagar", "Mahanagar", "Alambagh"],
    "Kanpur Nagar": ["Kanpur", "Civil Lines", "Swaroop Nagar", "Kakadeo", "Kidwai Nagar"],
    "Varanasi": ["Varanasi", "Lanka", "Assi Ghat", "Sigra", "Cantonment", "Bhelupur"],
    "Agra": ["Agra", "Tajganj", "Sanjay Place", "Civil Lines", "Kamla Nagar"],
    "Prayagraj": ["Allahabad", "Civil Lines", "Katra", "George Town", "Tagore Town"],
    "Meerut": ["Meerut", "Civil Lines", "Shastri Nagar", "Abu Lane"],
    "Bareilly": ["Bareilly", "Civil Lines", "Rampur Garden", "DD Puram"],
    "Gorakhpur": ["Gorakhpur", "Civil Lines", "Golghar", "Medical College Road"]
  },
  "Uttarakhand": {
    "Dehradun": ["Dehradun", "Rajpur Road", "Chakrata Road", "Dalanwala", "Clement Town", "Rishikesh"],
    "Haridwar": ["Haridwar", "Kankhal", "Ranipur", "Shivalik Nagar"],
    "Nainital": ["Nainital", "Mallital", "Tallital", "Haldwani", "Kathgodam"]
  },
  "West Bengal": {
    "Kolkata": ["Kolkata", "Park Street", "Ballygunge", "Salt Lake", "New Town", "Alipore", "Gariahat", "Behala", "Shyambazar", "Rajarhat", "Jadavpur"],
    "North 24 Parganas": ["Barasat", "Barrackpore", "Dum Dum", "Madhyamgram", "Bidhannagar"],
    "South 24 Parganas": ["Garia", "Sonarpur", "Baruipur", "Joka"],
    "Howrah": ["Howrah", "Shibpur", "Salkia", "Bally", "Mandirtala"],
    "Darjeeling": ["Darjeeling", "Mall Road", "Siliguri", "Kurseong", "Mirik"],
    "Paschim Bardhaman": ["Asansol", "Durgapur", "City Centre", "Benachity"]
  }
};

// Flatten all locations for search
export const ALL_INDIAN_CITIES: CityLocation[] = Object.entries(INDIA_LOCATIONS).flatMap(([state, districts]) =>
  Object.entries(districts).flatMap(([district, cities]) =>
    cities.map(city => ({ city, district, state }))
  )
);

export const formatLocationString = (city?: string, district?: string, state?: string): string => {
  const parts = [city, district, state].filter(Boolean) as string[];
  // Deduplicate parts like "Mumbai, Mumbai, Maharashtra" -> "Mumbai, Maharashtra"
  const uniqueParts = parts.filter((item, index) => parts.indexOf(item) === index);
  return uniqueParts.join(', ');
};

export const parseLocationString = (str?: string): { city: string; district: string; state: string } => {
  if (!str) return { city: '', district: '', state: '' };
  const parts = str.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 1) return { city: parts[0], district: '', state: '' };
  if (parts.length === 2) return { city: parts[0], district: '', state: parts[1] };
  return { city: parts[0], district: parts[1], state: parts.slice(2).join(', ') };
};

// Common Indian city aliases and alternate spellings
const CITY_ALIASES: { [key: string]: string[] } = {
  'mangalore': ['mangaluru', 'dakshina kannada'],
  'mangaluru': ['mangalore', 'dakshina kannada'],
  'bangalore': ['bengaluru', 'bengaluru urban'],
  'bengaluru': ['bangalore', 'bengaluru urban'],
  'gurgaon': ['gurugram'],
  'gurugram': ['gurgaon'],
  'bombay': ['mumbai', 'mumbai city', 'mumbai suburban'],
  'mumbai': ['bombay', 'mumbai suburban', 'mumbai city'],
  'calcutta': ['kolkata'],
  'kolkata': ['calcutta'],
  'madras': ['chennai'],
  'chennai': ['madras'],
  'allahabad': ['prayagraj'],
  'prayagraj': ['allahabad'],
  'mysore': ['mysuru'],
  'mysuru': ['mysore'],
  'belgaum': ['belagavi'],
  'belagavi': ['belgaum'],
  'shimoga': ['shivamogga'],
  'shivamogga': ['shimoga'],
  'cochin': ['kochi', 'ernakulam'],
  'kochi': ['cochin', 'ernakulam'],
  'trivandrum': ['thiruvananthapuram'],
  'thiruvananthapuram': ['trivandrum'],
  'calicut': ['kozhikode'],
  'kozhikode': ['calicut'],
  'pondicherry': ['puducherry'],
  'puducherry': ['pondicherry'],
  'hubli': ['dharwad', 'hubli-dharwad'],
  'dharwad': ['hubli', 'hubli-dharwad'],
  'aurangabad': ['chhatrapati sambhajinagar'],
  'chhatrapati sambhajinagar': ['aurangabad'],
  'noida': ['gautam buddha nagar'],
  'gautam buddha nagar': ['noida', 'greater noida'],
};

/**
 * Returns an array of search tokens for a given locality (including the town, parent district,
 * all sibling towns in that district, state, and known aliases).
 * This ensures that a broadcast job in "Surathkal" matches professionals registered under "Mangalore" or "Dakshina Kannada".
 */
export const getLocalityKeywords = (state?: string, district?: string, city?: string): string[] => {
  const keywords = new Set<string>();

  const addTerm = (term?: string) => {
    if (!term) return;
    const clean = term.trim();
    if (clean) {
      keywords.add(clean);
      const lower = clean.toLowerCase();
      if (CITY_ALIASES[lower]) {
        CITY_ALIASES[lower].forEach(alias => keywords.add(alias));
      }
    }
  };

  addTerm(city);
  addTerm(district);
  addTerm(state);

  // Look up district and sibling towns from INDIA_LOCATIONS
  if (state && INDIA_LOCATIONS[state]) {
    if (district && INDIA_LOCATIONS[state][district]) {
      INDIA_LOCATIONS[state][district].forEach(town => addTerm(town));
    } else if (city) {
      // Find district where city belongs
      for (const [distName, towns] of Object.entries(INDIA_LOCATIONS[state])) {
        if (distName.toLowerCase() === city.toLowerCase() || towns.some(t => t.toLowerCase() === city.toLowerCase())) {
          addTerm(distName);
          towns.forEach(town => addTerm(town));
          break;
        }
      }
    }
  } else if (city || district) {
    // Search across all states
    const searchTarget = (city || district || '').toLowerCase();
    for (const [stName, dists] of Object.entries(INDIA_LOCATIONS)) {
      for (const [distName, towns] of Object.entries(dists)) {
        if (
          distName.toLowerCase() === searchTarget ||
          towns.some(t => t.toLowerCase() === searchTarget)
        ) {
          addTerm(stName);
          addTerm(distName);
          towns.forEach(town => addTerm(town));
        }
      }
    }
  }

  return Array.from(keywords);
};

