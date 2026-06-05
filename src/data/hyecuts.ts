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

export interface BusinessHour {
  day: string;
  hours: string;
  open: boolean;
}

export const BUSINESS_HOURS: BusinessHour[] = [
  { day: 'Monday', hours: '12:00 PM - 10:00 PM', open: true },
  { day: 'Tuesday', hours: '12:00 PM - 10:00 PM', open: true },
  { day: 'Wednesday', hours: '12:00 PM - 10:00 PM', open: true },
  { day: 'Thursday', hours: '12:00 PM - 10:00 PM', open: true },
  { day: 'Friday', hours: '2:30 PM - 10:00 PM', open: true },
  { day: 'Saturday', hours: '12:00 PM - 10:00 PM', open: true },
  { day: 'Sunday', hours: '12:00 PM - 10:00 PM', open: true },
];

export interface ServiceItem {
  id: number;
  name: string;
  price: string;
  duration: string;
  category?: string;
}

export interface ServiceCategory {
  category: string;
  services: ServiceItem[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    category: 'Haircuts',
    services: [
      { id: 1, name: 'Adult Hair Cut', price: 'RM 25', duration: '30 mins', category: 'Haircuts' },
      { id: 4, name: 'Teenager Hair Cut', price: 'RM 20', duration: '30 mins', category: 'Haircuts' },
      { id: 5, name: 'Senior Citizen Hair Cut', price: 'RM 15', duration: '30 mins', category: 'Haircuts' },
      { id: 7, name: 'Kids Hair Cut', price: 'RM 15', duration: '30 mins', category: 'Haircuts' },
    ],
  },
  {
    category: 'Beard',
    services: [
      { id: 8, name: 'Beard Trim/Shape', price: 'RM 10', duration: '10 mins', category: 'Beard' },
      { id: 9, name: 'Shave/Clean', price: 'RM 10', duration: '10 mins', category: 'Beard' },
    ],
  },
  {
    category: 'Cut & Shave',
    services: [
      { id: 2, name: 'Adult Cut & Shave', price: 'RM 30', duration: '30 mins', category: 'Cut & Shave' },
      { id: 6, name: 'Senior Cut & Shave', price: 'RM 20', duration: '40 mins', category: 'Cut & Shave' },
    ],
  },
  {
    category: 'Treatment',
    services: [
      { id: 3, name: 'Keratin Treatment', price: 'RM 200', duration: '2 hrs', category: 'Treatment' },
      { id: 10, name: 'Hair Colour', price: 'RM 180', duration: '3 hrs', category: 'Treatment' },
    ],
  },
];

export const ALL_SERVICES: ServiceItem[] = [
  ...SERVICE_CATEGORIES.flatMap(c => c.services)
];

export const AVAILABLE_TIMES = ['12:00 PM', '2:30 PM', '4:00 PM', '6:00 PM', '8:00 PM'];

export const BOOKING_POLICIES = [
  'Arrive 10 minutes early so the schedule can stay on time.',
  'One slot is strictly for one person only.',
  'Choose a date and time you are certain you can attend.',
] as const;
