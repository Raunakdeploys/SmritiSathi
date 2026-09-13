import type { GeofenceZoneStatus } from '../types';

export interface LocationPreset {
  id: string;
  name: string;
  city: string;
  state: string;
  region: 'North East' | 'North' | 'West' | 'South' | 'East' | 'Central';
  latitude: number;
  longitude: number;
  description: string;
  landmark: string;
}

// Pan-India Location Presets Database with Assam & North East at the very top
export const PAN_INDIA_PRESETS: LocationPreset[] = [
  // --- Assam & North East ---
  {
    id: 'assam-guwahati-dispur',
    name: 'Guwahati (GS Road / Dispur Base)',
    city: 'Guwahati',
    state: 'Assam',
    region: 'North East',
    latitude: 26.1445,
    longitude: 91.7362,
    landmark: 'GS Road Capital Complex & Dispur Secretariat',
    description: 'CareCompass Default Home Base in Kamrup Metropolitan, Assam',
  },
  {
    id: 'assam-guwahati-uzanbazar',
    name: 'Guwahati (Uzan Bazar Riverfront)',
    city: 'Guwahati',
    state: 'Assam',
    region: 'North East',
    latitude: 26.1912,
    longitude: 91.7538,
    landmark: 'Brahmaputra Heritage Riverfront & Uzan Bazar Ghat',
    description: 'Scenic riverside promenade with walking parks in Guwahati',
  },
  {
    id: 'assam-guwahati-panbazar',
    name: 'Guwahati (Panbazar Cotton College)',
    city: 'Guwahati',
    state: 'Assam',
    region: 'North East',
    latitude: 26.1868,
    longitude: 91.7485,
    landmark: 'Cotton University & Dighalipukhuri Lake',
    description: 'Historic cultural center with walking paths around Dighalipukhuri',
  },
  {
    id: 'assam-jorhat',
    name: 'Jorhat (Tea Estate Quarter)',
    city: 'Jorhat',
    state: 'Assam',
    region: 'North East',
    latitude: 26.7509,
    longitude: 94.2037,
    landmark: 'Cinnamara Tea Estate & Tocklai Experimental Station',
    description: 'Historic tea capital of Assam with sprawling greenery',
  },
  {
    id: 'assam-dibrugarh',
    name: 'Dibrugarh (Phoolbagan)',
    city: 'Dibrugarh',
    state: 'Assam',
    region: 'North East',
    latitude: 27.4728,
    longitude: 94.912,
    landmark: 'Phoolbagan & Brahmaputra Dike Park',
    description: 'Upper Assam tea and medical hub along the Brahmaputra',
  },
  {
    id: 'assam-tezpur',
    name: 'Tezpur (Agnigarh Hill)',
    city: 'Tezpur',
    state: 'Assam',
    region: 'North East',
    latitude: 26.6238,
    longitude: 92.7938,
    landmark: 'Agnigarh Historic Hill & Mahabhairab Temple',
    description: 'Cultural city of eternal romance and mythology in Sonitpur',
  },
  {
    id: 'assam-silchar',
    name: 'Silchar (Barak Valley Center)',
    city: 'Silchar',
    state: 'Assam',
    region: 'North East',
    latitude: 24.8333,
    longitude: 92.7789,
    landmark: 'Barak Riverfront & Goldighi Mall',
    description: 'Southern Assam commercial and university hub in Cachar',
  },
  {
    id: 'meghalaya-shillong',
    name: 'Shillong (Ward Lake)',
    city: 'Shillong',
    state: 'Meghalaya',
    region: 'North East',
    latitude: 25.5788,
    longitude: 91.8933,
    landmark: 'Ward’s Lake & Police Bazar',
    description: 'Scotland of the East with pine groves and walking paths',
  },
  {
    id: 'nagaland-kohima',
    name: 'Kohima (Heritage Center)',
    city: 'Kohima',
    state: 'Nagaland',
    region: 'North East',
    latitude: 25.6751,
    longitude: 94.1086,
    landmark: 'War Memorial & Catholic Cathedral',
    description: 'Lush hill capital with crisp mountain breezes',
  },
  {
    id: 'manipur-imphal',
    name: 'Imphal (Kangla Fort)',
    city: 'Imphal',
    state: 'Manipur',
    region: 'North East',
    latitude: 24.817,
    longitude: 93.9368,
    landmark: 'Kangla Palace & Ima Keithel Mother Market',
    description: 'Historic kingdom capital surrounded by green hills',
  },
  {
    id: 'tripura-agartala',
    name: 'Agartala (Ujjayanta Palace)',
    city: 'Agartala',
    state: 'Tripura',
    region: 'North East',
    latitude: 23.8315,
    longitude: 91.2868,
    landmark: 'Ujjayanta Palace & Heritage Park',
    description: 'Royal palace gardens and peaceful residential lanes',
  },
  {
    id: 'sikkim-gangtok',
    name: 'Gangtok (MG Marg)',
    city: 'Gangtok',
    state: 'Sikkim',
    region: 'North East',
    latitude: 27.3389,
    longitude: 88.6065,
    landmark: 'MG Marg Promenade & Ridge Park',
    description: 'Himalayan walking boulevard with panoramic mountain views',
  },

  // --- Major Metros & Cities Across India ---
  {
    id: 'delhi-cp',
    name: 'Delhi NCR (Connaught Place)',
    city: 'New Delhi',
    state: 'Delhi',
    region: 'North',
    latitude: 28.6315,
    longitude: 77.2167,
    landmark: 'Central Park & Inner Circle CP',
    description: 'Iconic heritage heart of the National Capital',
  },
  {
    id: 'delhi-saket',
    name: 'Delhi NCR (Saket / South Delhi)',
    city: 'New Delhi',
    state: 'Delhi',
    region: 'North',
    latitude: 28.5244,
    longitude: 77.2167,
    landmark: 'Select Citywalk & Garden of Five Senses',
    description: 'Peaceful residential and green garden neighborhood',
  },
  {
    id: 'delhi-noida',
    name: 'Delhi NCR (Noida Sector 18)',
    city: 'Noida',
    state: 'Uttar Pradesh',
    region: 'North',
    latitude: 28.5708,
    longitude: 77.3271,
    landmark: 'Atta Market & Wave City Center',
    description: 'Modern residential and urban center in NCR',
  },
  {
    id: 'delhi-gurgaon',
    name: 'Delhi NCR (Cyber City Gurgaon)',
    city: 'Gurugram',
    state: 'Haryana',
    region: 'North',
    latitude: 28.495,
    longitude: 77.0895,
    landmark: 'DLF CyberHub & Galleria Market',
    description: 'Modern condominium hub with wide walkways',
  },
  {
    id: 'mumbai-marine-drive',
    name: 'Mumbai (Marine Drive Promenade)',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    latitude: 18.9438,
    longitude: 72.8233,
    landmark: 'Queen’s Necklace & Chowpatty Beach',
    description: 'Iconic sea-facing walking promenade in South Mumbai',
  },
  {
    id: 'mumbai-bandra',
    name: 'Mumbai (Bandra Bandstand)',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    latitude: 19.0435,
    longitude: 72.8197,
    landmark: 'Bandstand Sea View & Mount Mary Basilica',
    description: 'Breezy coastal residential neighborhood in suburban Mumbai',
  },
  {
    id: 'bengaluru-indiranagar',
    name: 'Bengaluru (Indiranagar 100ft Road)',
    city: 'Bengaluru',
    state: 'Karnataka',
    region: 'South',
    latitude: 12.9719,
    longitude: 77.6412,
    landmark: 'Defense Colony & Indiranagar Club',
    description: 'Tree-lined cosmopolitan neighborhood with parks',
  },
  {
    id: 'bengaluru-koramangala',
    name: 'Bengaluru (Koramangala 4th Block)',
    city: 'Bengaluru',
    state: 'Karnataka',
    region: 'South',
    latitude: 12.9352,
    longitude: 77.6245,
    landmark: 'St. John’s Hospital & Forum Mall',
    description: 'Popular residential suburb with medical institutions',
  },
  {
    id: 'kolkata-parkstreet',
    name: 'Kolkata (Park Street / Victoria)',
    city: 'Kolkata',
    state: 'West Bengal',
    region: 'East',
    latitude: 22.5517,
    longitude: 88.3524,
    landmark: 'Victoria Memorial Gardens & St. Paul’s Cathedral',
    description: 'Historic cultural quarter with sprawling shaded gardens',
  },
  {
    id: 'kolkata-saltlake',
    name: 'Kolkata (Salt Lake Sector V)',
    city: 'Kolkata',
    state: 'West Bengal',
    region: 'East',
    latitude: 22.5804,
    longitude: 88.4378,
    landmark: 'Central Park Salt Lake & Nicco Park',
    description: 'Planned township with wide avenues and water bodies',
  },
  {
    id: 'chennai-marina',
    name: 'Chennai (Marina Beach Promenade)',
    city: 'Chennai',
    state: 'Tamil Nadu',
    region: 'South',
    latitude: 13.0499,
    longitude: 80.2824,
    landmark: 'Santhome Cathedral & Marina Lighthouse',
    description: 'Longest natural urban beach in India with walking trails',
  },
  {
    id: 'hyderabad-hitec',
    name: 'Hyderabad (Hitec City / Madhapur)',
    city: 'Hyderabad',
    state: 'Telangana',
    region: 'South',
    latitude: 17.4474,
    longitude: 78.3762,
    landmark: 'Cyber Towers & Durgam Cheruvu Cable Bridge',
    description: 'Lakeside urban sector with modern infrastructure',
  },
  {
    id: 'pune-kothrud',
    name: 'Pune (Kothrud / Deccan Gymkhana)',
    city: 'Pune',
    state: 'Maharashtra',
    region: 'West',
    latitude: 18.5074,
    longitude: 73.8077,
    landmark: 'Deccan Gymkhana & ARAI Hills',
    description: 'Cultural and educational capital of Maharashtra',
  },
  {
    id: 'jaipur-c-scheme',
    name: 'Jaipur (C-Scheme / Central Park)',
    city: 'Jaipur',
    state: 'Rajasthan',
    region: 'North',
    latitude: 26.9075,
    longitude: 75.8056,
    landmark: 'Central Park Flag & Birla Auditorium',
    description: 'Pink City heritage center with expansive jogging tracks',
  },
  {
    id: 'ahmedabad-riverfront',
    name: 'Ahmedabad (Sabarmati Riverfront)',
    city: 'Ahmedabad',
    state: 'Gujarat',
    region: 'West',
    latitude: 23.0338,
    longitude: 72.585,
    landmark: 'Sabarmati Ashram & Riverfront Garden',
    description: 'Beautiful paved riverside promenade and tranquil gardens',
  },
  {
    id: 'lucknow-hazratganj',
    name: 'Lucknow (Hazratganj Heritage Lane)',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    region: 'North',
    latitude: 26.85,
    longitude: 80.9499,
    landmark: 'Hazratganj Clock Tower & Begum Hazrat Mahal Park',
    description: 'City of Nawabs with heritage architecture and tea houses',
  },
  {
    id: 'varanasi-ghats',
    name: 'Varanasi (Assi Ghat Riverfront)',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    region: 'North',
    latitude: 25.2882,
    longitude: 83.0069,
    landmark: 'Assi Ghat & Banaras Hindu University',
    description: 'Spiritual heart of India along the sacred Ganga',
  },
  {
    id: 'kochi-marine-drive',
    name: 'Kochi (Marine Drive Walkway)',
    city: 'Kochi',
    state: 'Kerala',
    region: 'South',
    latitude: 9.9792,
    longitude: 76.2755,
    landmark: 'Rainbow Bridge & Ernakulam Boat Jetty',
    description: 'Scenic Arabian sea backwaters with coconut palms',
  },
  {
    id: 'chandigarh-sector17',
    name: 'Chandigarh (Sector 17 Plaza)',
    city: 'Chandigarh',
    state: 'Punjab/Haryana',
    region: 'North',
    latitude: 30.7398,
    longitude: 76.7827,
    landmark: 'Sukhna Lake & Rose Garden',
    description: 'The City Beautiful with world-class pedestrian sectors',
  },
  {
    id: 'patna-gandhi-maidan',
    name: 'Patna (Gandhi Maidan)',
    city: 'Patna',
    state: 'Bihar',
    region: 'East',
    latitude: 25.6154,
    longitude: 85.1415,
    landmark: 'Golghar & Ganga Riverfront Walkway',
    description: 'Historic city of Pataliputra along the Ganga river',
  },
];

// Emergency Helpline database for India
export const INDIA_EMERGENCY_SERVICES = [
  {
    id: 'police',
    name: 'Police Emergency',
    number: '112',
    backupNumber: '100',
    description: 'National Emergency Response for immediate distress or missing person report',
    icon: 'local_police',
    color: '#0F172A',
  },
  {
    id: 'ambulance',
    name: 'Medical Ambulance',
    number: '108',
    backupNumber: '102',
    description: 'Emergency Medical Service and Trauma Paramedic Response',
    icon: 'medical_services',
    color: '#E11D48',
  },
  {
    id: 'senior-citizen',
    name: 'Senior Citizen Helpline',
    number: '14567',
    backupNumber: '1291',
    description: 'Elderline: National Helpline for Senior Citizens (Government of India)',
    icon: 'elderly',
    color: '#FF6321',
  },
  {
    id: 'women-safety',
    name: 'Women & Caregiver Helpline',
    number: '1091',
    backupNumber: '181',
    description: 'Women in distress and family safety assistance line',
    icon: 'support_agent',
    color: '#7C3AED',
  },
];

// 11 Indian Languages Voice & Reassurance Support Config
export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  voiceTag: string;
  sampleReassurance: string;
  emergencyAlertIntro: string;
}

export const INDIAN_LANGUAGES: LanguageOption[] = [
  {
    code: 'en-IN',
    name: 'English (India)',
    nativeName: 'English (India)',
    voiceTag: 'en-IN',
    sampleReassurance: 'Dadaji, you are completely safe. Raunak is nearby and heading towards you right now. Please sit down comfortably.',
    emergencyAlertIntro: 'EMERGENCY DEMENTIA ALERT: Elder has breached the safe zone perimeter.',
  },
  {
    code: 'as-IN',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    voiceTag: 'as-IN',
    sampleReassurance: 'দাদাজী, আপুনি একদম সুৰক্ষিত আছে। ৰৌনক আপোনাৰ ওচৰলৈ আহি আছে। আপুনি অলপ জিৰণি লওক, কোনো চিন্তা নকৰিব।',
    emergencyAlertIntro: 'জৰুৰী সতৰ্কতা: দাদাজী নিৰাপদ এলেকাৰ বাহিৰলৈ গৈছে।',
  },
  {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    voiceTag: 'hi-IN',
    sampleReassurance: 'दादाजी, आप बिल्कुल सुरक्षित हैं। रौनक आपके पास ही आ रहे हैं। आप शांति से बैठ जाइए, चिंता की कोई बात नहीं है।',
    emergencyAlertIntro: 'आपातकालीन अलर्ट: दादाजी सुरक्षित सीमा से बाहर चले गए हैं।',
  },
  {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    voiceTag: 'bn-IN',
    sampleReassurance: 'দাদাজি, আপনি সম্পূর্ণ নিরাপদে আছেন। রৌনক এখনই আপনার কাছে আসছেন। আপনি একটু শান্ত হয়ে বসুন।',
    emergencyAlertIntro: 'জরুরি সতর্কতা: দাদাজি নিরাপদ এলাকার বাইরে চলে গেছেন।',
  },
  {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    voiceTag: 'ta-IN',
    sampleReassurance: 'தாத்தா, நீங்கள் மிகவும் பாதுகாப்பாக இருக்கிறீர்கள். ரௌனக் உங்களிடம் வந்து கொண்டிருக்கிறார். தயவுசெய்து அமைதியாக அமருங்கள்.',
    emergencyAlertIntro: 'அவசர எச்சரிக்கை: தாத்தா பாதுகாப்பான பகுதியை விட்டு வெளியேறிவிட்டார்.',
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    voiceTag: 'te-IN',
    sampleReassurance: 'తాతగారు, మీరు పూర్తిగా సురక్షితంగా ఉన్నారు. రౌనక్ మీ వద్దకు వస్తున్నారు. దయచేసి ప్రశాంతంగా కూర్చోండి.',
    emergencyAlertIntro: 'అత్యవసర హెచ్చరిక: తాతగారు సురక్షిత సరిహద్దు దాటారు.',
  },
  {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    voiceTag: 'mr-IN',
    sampleReassurance: 'दादाजी, तुम्ही अगदी सुरक्षित आहात. रौनक तुमच्याकडेच येत आहेत. कृपया शांतपणे बसा, काळजी करू नका.',
    emergencyAlertIntro: 'तातडीचा इशारा: दादाजी सुरक्षित क्षेत्राबाहेर गेले आहेत.',
  },
  {
    code: 'gu-IN',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    voiceTag: 'gu-IN',
    sampleReassurance: 'દાદાજી, તમે બિલકુલ સુરક્ષિત છો. રૌનક તમારી પાસે આવી રહ્યા છે. કૃપા કરીને શાંતિથી બેસો, ચિંતા કરશો નહીં.',
    emergencyAlertIntro: 'ઇમરજન્સી ચેતવણી: દાદાજી સુરક્ષિત ક્ષેત્રની બહાર ગયા છે.',
  },
  {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    voiceTag: 'kn-IN',
    sampleReassurance: 'ತಾತಯ್ಯ, ನೀವು ಸಂಪೂರ್ಣವಾಗಿ ಸುರಕ್ಷಿತವಾಗಿದ್ದೀರಿ. ರೌನಕ್ ನಿಮ್ಮ ಬಳಿ ಬರುತ್ತಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ಶಾಂತರಾಗಿ ಕುಳಿತುಕೊಳ್ಳಿ.',
    emergencyAlertIntro: 'ತುರ್ತು ಎಚ್ಚರಿಕೆ: ತಾತಯ್ಯ ಸುರಕ್ಷಿತ ವಲಯದಿಂದ ಹೊರಗೆ ಹೋಗಿದ್ದಾರೆ.',
  },
  {
    code: 'ml-IN',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    voiceTag: 'ml-IN',
    sampleReassurance: 'അപ്പൂപ്പാ, നിങ്ങൾ പൂർണ്ണമായും സുരക്ഷിതനാണ്. രൗനക് നിങ്ങളുടെ അടുത്തേക്ക് വരുന്നുണ്ട്. ദയവായി ശാന്തമായി ഇരിക്കുക.',
    emergencyAlertIntro: 'അടിയന്തര മുന്നറിയിപ്പ്: അപ്പൂപ്പൻ സുരക്ഷിത പരിധിക്ക് പുറത്തുപോയി.',
  },
  {
    code: 'pa-IN',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    voiceTag: 'pa-IN',
    sampleReassurance: 'ਬਾਬਾ ਜੀ, ਤੁਸੀਂ ਬਿਲਕੁਲ ਸੁਰੱਖਿਅਤ ਹੋ। ਰੌਣਕ ਤੁਹਾਡੇ ਵੱਲ ਆ ਰਹੇ ਹਨ। ਕਿਰਪਾ ਕਰਕੇ ਸ਼ਾਂਤ ਹੋ ਕੇ ਬੈਠ ਜਾਓ।',
    emergencyAlertIntro: 'ਐਮਰਜੈਂਸੀ ਅਲਰਟ: ਬਾਬਾ ਜੀ ਸੁਰੱਖਿਅਤ ਦਾਇਰੇ ਤੋਂ ਬਾਹਰ ਚਲੇ ਗਏ ਹਨ।',
  },
];

/**
 * Calculates Haversine distance between two GPS coordinates in meters
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10;
}

/**
 * Calculates initial compass bearing from point 1 to point 2 in degrees (0 - 360)
 */
export function calculateBearingDegrees(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return Math.round(bearing);
}

/**
 * Converts degrees into 8-point compass text
 */
export function degreesToCompassText(degrees: number): string {
  const directions = [
    'North (N)',
    'North-East (NE)',
    'East (E)',
    'South-East (SE)',
    'South (S)',
    'South-West (SW)',
    'West (W)',
    'North-West (NW)',
  ];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Determines geofence zone status based on distance and dual boundary thresholds
 */
export function determineGeofenceStatus(
  distanceMeters: number,
  safeRadiusMeters = 300,
  alertRadiusMeters = 600
): GeofenceZoneStatus {
  if (distanceMeters <= safeRadiusMeters) {
    return 'SAFE_ZONE';
  } else if (distanceMeters <= alertRadiusMeters) {
    return 'WARNING_BORDER';
  } else {
    return 'CRITICAL_BREACH';
  }
}

/**
 * Checks whether current time falls within twilight wandering / sundowning risk hours (5:00 PM to 8:00 PM)
 */
export function checkSundowningRisk(): { isRiskHours: boolean; riskLevel: 'low' | 'moderate' | 'high' } {
  const hour = new Date().getHours();
  if (hour >= 17 && hour < 20) {
    return { isRiskHours: true, riskLevel: 'high' };
  } else if (hour >= 16 && hour < 21) {
    return { isRiskHours: true, riskLevel: 'moderate' };
  }
  return { isRiskHours: false, riskLevel: 'low' };
}

/**
 * Generates official WhatsApp SOS emergency dispatch message and URL
 */
export function generateWhatsAppSOSUrl({
  caregiverPhone = '+919073719787',
  patientName = 'Dadaji',
  latitude,
  longitude,
  distanceMeters,
  homeLabel = 'Home Base',
  batteryLevel = 84,
  cause = 'Geofence Breach',
}: {
  caregiverPhone?: string;
  patientName?: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  homeLabel?: string;
  batteryLevel?: number;
  cause?: string;
}): { message: string; url: string; waMeUrl: string; telUrl: string; smsUrl: string; cleanDigits: string } {
  // Normalize phone (strip spaces, +, -, etc. Keep leading country code)
  let cleanDigits = caregiverPhone.replace(/[^0-9]/g, '');
  if (cleanDigits.startsWith('0')) {
    cleanDigits = cleanDigits.replace(/^0+/, '');
  }
  if (cleanDigits.length === 10) {
    cleanDigits = `91${cleanDigits}`;
  }

  const mapsLink = `https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  const message = `🚨 EMERGENCY DEMENTIA ALERT: ${patientName} has triggered an alert (${cause})!
📍 Current Location: ${mapsLink}
📏 Distance from Home (${homeLabel}): ${Math.round(distanceMeters)}m
🔋 Patient Device Battery: ${batteryLevel}%
⏰ Timestamp: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}

Please check immediately or call local emergency services if unreachable.`;

  const url = `https://api.whatsapp.com/send?phone=${cleanDigits}&text=${encodeURIComponent(message)}`;
  const waMeUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
  const telUrl = `tel:+${cleanDigits}`;
  const smsUrl = `sms:+${cleanDigits}?body=${encodeURIComponent(message)}`;

  return { message, url, waMeUrl, telUrl, smsUrl, cleanDigits };
}

/**
 * Directly launches WhatsApp message and/or native phone call
 */
export function triggerDirectContactAction({
  phone,
  message,
  actionType = 'both',
}: {
  phone: string;
  message?: string;
  actionType?: 'whatsapp' | 'call' | 'sms' | 'both';
}) {
  let cleanDigits = phone.replace(/[^0-9]/g, '');
  if (cleanDigits.startsWith('0')) {
    cleanDigits = cleanDigits.replace(/^0+/, '');
  }
  if (cleanDigits.length === 10) {
    cleanDigits = `91${cleanDigits}`;
  }

  if (actionType === 'whatsapp' || actionType === 'both') {
    if (message) {
      const waUrl = `https://api.whatsapp.com/send?phone=${cleanDigits}&text=${encodeURIComponent(message)}`;
      try {
        window.open(waUrl, '_blank');
      } catch (e) {
        console.warn('WhatsApp window.open blocked:', e);
      }
    }
  }

  if (actionType === 'call' || actionType === 'both') {
    try {
      window.location.href = `tel:+${cleanDigits}`;
    } catch (e) {
      console.warn('Direct telephone trigger error:', e);
    }
  }

  if (actionType === 'sms') {
    if (message) {
      try {
        window.location.href = `sms:+${cleanDigits}?body=${encodeURIComponent(message)}`;
      } catch (e) {
        console.warn('SMS trigger error:', e);
      }
    }
  }
}

/**
 * Reverse geocodes latitude/longitude into human-readable city, suburb, and street name
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<{ city: string; area: string; displayName: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.county ||
      addr.state_district ||
      'Local Area';
    const area =
      addr.neighbourhood ||
      addr.suburb ||
      addr.road ||
      `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    return {
      city,
      area,
      displayName: data.display_name || `${city}, ${area}`,
    };
  } catch (err) {
    console.warn('Reverse geocode error:', err);
    return null;
  }
}

/**
 * Searches for an address or city name and returns latitude and longitude
 */
export async function searchGeocodeAddress(
  query: string
): Promise<{ lat: number; lng: number; displayName: string; city: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=1`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      const first = data[0];
      const parts = (first.display_name || '').split(',');
      const city = parts[0]?.trim() || query;
      return {
        lat: parseFloat(first.lat),
        lng: parseFloat(first.lon),
        displayName: first.display_name,
        city,
      };
    }
    return null;
  } catch (err) {
    console.warn('Geocode search error:', err);
    return null;
  }
}
