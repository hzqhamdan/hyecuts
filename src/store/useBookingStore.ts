import { create } from 'zustand';

interface BookingState {
  step: number;
  openCategory: string | null;
  selectedService: string | null;
  selectedStaff: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  bookingRef: string;
  isConfirming: boolean;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setOpenCategory: (category: string | null) => void;
  setSelectedService: (service: string | null) => void;
  setSelectedStaff: (staff: string | null) => void;
  setSelectedDate: (date: string | null) => void;
  setSelectedTime: (time: string | null) => void;
  setBookingRef: (ref: string) => void;
  setIsConfirming: (isConfirming: boolean) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  step: 0,
  openCategory: 'Haircuts',
  selectedService: null,
  selectedStaff: null,
  selectedDate: null,
  selectedTime: null,
  bookingRef: '',
  isConfirming: false,

  setStep: (step) => { set({ step }); },
  nextStep: () => { set((state) => ({ step: state.step + 1 })); },
  prevStep: () => { set((state) => ({ step: state.step - 1 })); },
  setOpenCategory: (openCategory) => { set({ openCategory }); },
  setSelectedService: (selectedService) => { set({ selectedService }); },
  setSelectedStaff: (selectedStaff) => { set({ selectedStaff }); },
  setSelectedDate: (selectedDate) => { set({ selectedDate }); },
  setSelectedTime: (selectedTime) => { set({ selectedTime }); },
  setBookingRef: (bookingRef) => { set({ bookingRef }); },
  setIsConfirming: (isConfirming) => { set({ isConfirming }); },
  reset: () => { 
    set({ 
      step: 0, 
      openCategory: 'Haircuts', 
      selectedService: null, 
      selectedStaff: null, 
      selectedDate: null, 
      selectedTime: null, 
      bookingRef: '', 
      isConfirming: false 
    }); 
  },
}));
