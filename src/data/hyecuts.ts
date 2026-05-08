export const HYECUTS = {
  name: 'HYECUTS BARBERSHOP',
  address: '3361 Jalan Sungai Penchala, 60000 Kuala Lumpur, Wilayah Persekutuan',
  waze: 'Hyecuts Barbershop',
  phone: '013-366 6693',
  email: 'haiqalqal7@gmail.com',
  instagram: 'https://www.instagram.com/hyecuts_barbershop/',
  facebook: 'https://www.facebook.com/hyecuts.barbershop.754',
} as const;

export const TEAM_MEMBERS = [
  { name: 'Haiqal', role: 'Master Barber' },
  { name: 'Naim', role: 'Senior Artisan' },
] as const;

export const BUSINESS_HOURS = [
  { day: 'Monday', hours: '12:00 PM - 10:00 PM', open: true },
  { day: 'Tuesday', hours: '12:00 PM - 10:00 PM', open: true },
  { day: 'Wednesday', hours: '12:00 PM - 10:00 PM', open: true },
  { day: 'Thursday', hours: 'Closed', open: false },
  { day: 'Friday', hours: '2:30 PM - 10:00 PM', open: true },
  { day: 'Saturday', hours: '12:00 PM - 10:00 PM', open: true },
  { day: 'Sunday', hours: '12:00 PM - 10:00 PM', open: true },
] as const;

export const SERVICE_MENU = [
  { name: 'Adult Hair Cut', price: 'RM 25', duration: '30 mins', category: 'Adult' },
  { name: 'Cut & Shave', price: 'RM 30', duration: '30 mins', category: 'Adult' },
  { name: 'Keratin Treatment', price: 'RM 200', duration: '2 hrs', category: 'Other' },
  { name: 'Teenager Hair Cut', price: 'RM 20', duration: '30 mins', category: 'Teenager' },
  { name: 'Senior Citizen Hair Cut', price: 'RM 15', duration: '30 mins', category: 'Senior Citizen' },
  { name: 'Senior Cut & Shave', price: 'RM 20', duration: '40 mins', category: 'Senior Citizen' },
  { name: 'Kids Hair Cut', price: 'RM 15', duration: '30 mins', category: 'Kids' },
  { name: 'Beard Trim/Shape', price: 'RM 10', duration: '10 mins', category: 'Beard' },
  { name: 'Shave/Clean', price: 'RM 10', duration: '10 mins', category: 'Beard' },
  { name: 'Hair Colour', price: 'RM 180', duration: '3 hrs', category: 'Other' },
] as const;

export const BOOKING_POLICIES = [
  'Arrive 10 minutes early so the schedule can stay on time.',
  'One slot is strictly for one person only.',
  'Choose a date and time you are certain you can attend.',
] as const;
