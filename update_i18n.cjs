const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src', 'i18n', 'locales', 'en.json');
const msPath = path.join(__dirname, 'src', 'i18n', 'locales', 'ms.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ms = JSON.parse(fs.readFileSync(msPath, 'utf8'));

// Add Landing Page translations
const landingEn = {
  services_pricing: "Services & Pricing",
  services: "Services",
  book_now: "Book Now",
  business_hours: "Business Hours",
  weekly_schedule: "Weekly Schedule",
  booking_policies: "Booking Policies",
  arrive_prepared: "Arrive prepared",
  reserve_slot: "Reserve a Slot",
  visit_hyecuts: "Visit Hyecuts",
  address: "Address",
  waze: "Waze",
  contact_details: "Contact",
  team_members: "Team Members",
  social: "Social",
  no_preference: "No Preference",
  first_available: "First available",
  policy_1: "Arrive 10 minutes early so the schedule can stay on time.",
  policy_2: "One slot is strictly for one person only.",
  policy_3: "Choose a date and time you are certain you can attend."
};

const landingMs = {
  services_pricing: "Perkhidmatan & Harga",
  services: "Perkhidmatan",
  book_now: "Tempah Sekarang",
  business_hours: "Waktu Operasi",
  weekly_schedule: "Jadual Mingguan",
  booking_policies: "Polisi Tempahan",
  arrive_prepared: "Hadir dengan bersedia",
  reserve_slot: "Tempah Slot",
  visit_hyecuts: "Kunjungi Hyecuts",
  address: "Alamat",
  waze: "Waze",
  contact_details: "Hubungi",
  team_members: "Ahli Pasukan",
  social: "Sosial",
  no_preference: "Tiada Pilihan",
  first_available: "Mana-mana yang kosong",
  policy_1: "Hadir 10 minit lebih awal untuk melancarkan jadual.",
  policy_2: "Satu slot tempahan adalah untuk seorang sahaja.",
  policy_3: "Pilih tarikh dan masa yang anda pasti boleh hadir."
};

en.landing = landingEn;
ms.landing = landingMs;

// Add Data translations
const dataEn = {
  days: {
    Monday: "Monday", Tuesday: "Tuesday", Wednesday: "Wednesday", Thursday: "Thursday", Friday: "Friday", Saturday: "Saturday", Sunday: "Sunday"
  },
  roles: {
    "Master Barber": "Master Barber",
    "Senior Artisan": "Senior Artisan"
  },
  categories: {
    "Haircuts": "Haircuts",
    "Beard": "Beard",
    "Cut & Shave": "Cut & Shave",
    "Treatment": "Treatment"
  },
  services: {
    "Adult Hair Cut": "Adult Hair Cut",
    "Teenager Hair Cut": "Teenager Hair Cut",
    "Senior Citizen Hair Cut": "Senior Citizen Hair Cut",
    "Kids Hair Cut": "Kids Hair Cut",
    "Beard Trim/Shape": "Beard Trim/Shape",
    "Shave/Clean": "Shave/Clean",
    "Adult Cut & Shave": "Adult Cut & Shave",
    "Senior Cut & Shave": "Senior Cut & Shave",
    "Keratin Treatment": "Keratin Treatment",
    "Hair Colour": "Hair Colour"
  }
};

const dataMs = {
  days: {
    Monday: "Isnin", Tuesday: "Selasa", Wednesday: "Rabu", Thursday: "Khamis", Friday: "Jumaat", Saturday: "Sabtu", Sunday: "Ahad"
  },
  roles: {
    "Master Barber": "Ketua Tukang Gunting",
    "Senior Artisan": "Tukang Gunting Kanan"
  },
  categories: {
    "Haircuts": "Guntingan Rambut",
    "Beard": "Jambang",
    "Cut & Shave": "Gunting & Cukur",
    "Treatment": "Rawatan"
  },
  services: {
    "Adult Hair Cut": "Gunting Rambut Dewasa",
    "Teenager Hair Cut": "Gunting Rambut Remaja",
    "Senior Citizen Hair Cut": "Gunting Rambut Warga Emas",
    "Kids Hair Cut": "Gunting Rambut Kanak-Kanak",
    "Beard Trim/Shape": "Kemaskan Jambang",
    "Shave/Clean": "Cukur Licin",
    "Adult Cut & Shave": "Gunting & Cukur Dewasa",
    "Senior Cut & Shave": "Gunting & Cukur Warga Emas",
    "Keratin Treatment": "Rawatan Keratin",
    "Hair Colour": "Warna Rambut"
  }
};

en.data = dataEn;
ms.data = dataMs;

// Login Screen
const loginEn = {
  member_login: "Member Login",
  welcome_back: "Welcome back. Authenticate to access your portfolio.",
  identifier_label: "Membership ID or Email",
  identifier_placeholder: "Enter your identifier",
  sequence_label: "Security Sequence (Password)",
  sequence_placeholder: "Enter your sequence",
  authenticate: "Authenticate",
  pdpa: "I acknowledge the PDPA conditions for data handling.",
  register_cta: "New? Establish Profile",
  login_cta: "Return to Authentication",
  processing: "Processing...",
  establish_profile: "Establish Profile",
  join_network: "Join the network to track your assets and bookings."
};

const loginMs = {
  member_login: "Log Masuk Ahli",
  welcome_back: "Selamat kembali. Sahkan untuk mengakses portfolio anda.",
  identifier_label: "ID Keahlian atau E-mel",
  identifier_placeholder: "Masukkan pengenalan anda",
  sequence_label: "Jujukan Keselamatan (Kata Laluan)",
  sequence_placeholder: "Masukkan jujukan anda",
  authenticate: "Sahkan",
  pdpa: "Saya mengakui syarat PDPA untuk pengendalian data.",
  register_cta: "Baru? Cipta Profil",
  login_cta: "Kembali ke Pengesahan",
  processing: "Memproses...",
  establish_profile: "Cipta Profil",
  join_network: "Sertai rangkaian untuk mengesan aset dan tempahan anda."
};

en.login = loginEn;
ms.login = loginMs;

// Add some more booking texts
en.booking = {
  ...en.booking,
  continue_barber: "Continue to Barber",
  continue_schedule: "Continue to Schedule",
  review_booking: "Review Booking",
  day: "Day",
  time: "Time",
  total: "Total",
  duration: "Duration",
  securing: "Securing Appointment...",
  view_appointments: "View My Appointments",
  closed_note: "Thursday is closed. Choose a day that works with your schedule.",
  barber_note: "Haiqal and Naim are the listed team members in the studio notes.",
  service_note: "Choose from the Hyecuts service menu.",
  policy_note: "Please confirm your appointment details and the studio policy reminders."
};

ms.booking = {
  ...ms.booking,
  continue_barber: "Teruskan ke Tukang Gunting",
  continue_schedule: "Teruskan ke Jadual",
  review_booking: "Semak Tempahan",
  day: "Hari",
  time: "Masa",
  total: "Jumlah",
  duration: "Tempoh",
  securing: "Mengesahkan Tempahan...",
  view_appointments: "Lihat Temu Janji Saya",
  closed_note: "Tutup pada hari Khamis. Pilih hari yang sesuai dengan jadual anda.",
  barber_note: "Haiqal dan Naim adalah ahli pasukan yang disenaraikan di nota studio.",
  service_note: "Pilih daripada menu perkhidmatan Hyecuts.",
  policy_note: "Sila sahkan butiran temu janji anda dan peringatan polisi studio."
};

// Add Lounge texts
en.lounge = {
  ...en.lounge,
  welcome: "Welcome",
  points_balance: "Points Balance",
  pts: "pts",
  redeem: "Redeem",
  history: "History",
  no_rewards: "No rewards available yet.",
  no_activity: "No recent activity.",
  total: "Total"
};

ms.lounge = {
  ...ms.lounge,
  welcome: "Selamat Datang",
  points_balance: "Baki Mata",
  pts: "mata",
  redeem: "Tebus",
  history: "Sejarah",
  no_rewards: "Tiada ganjaran tersedia lagi.",
  no_activity: "Tiada aktiviti terkini.",
  total: "Jumlah"
};

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(msPath, JSON.stringify(ms, null, 2));
