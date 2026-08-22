import { describe, it, expect, beforeEach } from 'vitest';
import { useBookingStore } from './useBookingStore';

describe('useBookingStore', () => {
  beforeEach(() => {
    useBookingStore.getState().reset();
  });

  it('should have correct initial state defaults', () => {
    const state = useBookingStore.getState();
    expect(state.step).toBe(0);
    expect(state.openCategory).toBe('Haircuts');
    expect(state.selectedService).toBeNull();
    expect(state.selectedStaff).toBeNull();
    expect(state.selectedDate).toBeNull();
    expect(state.selectedTime).toBeNull();
    expect(state.bookingRef).toBe('');
    expect(state.isConfirming).toBe(false);
    expect(state.clientSecret).toBeNull();
  });

  it('setService() should update selected service', () => {
    useBookingStore.getState().setSelectedService('Adult Hair Cut');
    expect(useBookingStore.getState().selectedService).toBe('Adult Hair Cut');
  });

  it('setService() should set null when clearing service', () => {
    useBookingStore.getState().setSelectedService('Adult Hair Cut');
    useBookingStore.getState().setSelectedService(null);
    expect(useBookingStore.getState().selectedService).toBeNull();
  });

  it('setBarber() should update selected staff', () => {
    useBookingStore.getState().setSelectedStaff('haiqal');
    expect(useBookingStore.getState().selectedStaff).toBe('haiqal');
  });

  it('setBarber() should set any value correctly', () => {
    useBookingStore.getState().setSelectedStaff('any');
    expect(useBookingStore.getState().selectedStaff).toBe('any');
  });

  it('setDateTime() should update selected date', () => {
    useBookingStore.getState().setSelectedDate('d1');
    expect(useBookingStore.getState().selectedDate).toBe('d1');
  });

  it('setDateTime() should update selected time', () => {
    useBookingStore.getState().setSelectedTime('02:00 PM');
    expect(useBookingStore.getState().selectedTime).toBe('02:00 PM');
  });

  it('nextStep() should increment step', () => {
    useBookingStore.getState().nextStep();
    expect(useBookingStore.getState().step).toBe(1);
  });

  it('nextStep() should increment step multiple times', () => {
    useBookingStore.getState().nextStep();
    useBookingStore.getState().nextStep();
    useBookingStore.getState().nextStep();
    expect(useBookingStore.getState().step).toBe(3);
  });

  it('prevStep() should decrement step', () => {
    useBookingStore.getState().setStep(3);
    useBookingStore.getState().prevStep();
    expect(useBookingStore.getState().step).toBe(2);
  });

  it('prevStep() should not go below step 0', () => {
    useBookingStore.getState().prevStep();
    expect(useBookingStore.getState().step).toBe(0);
    useBookingStore.getState().prevStep();
    expect(useBookingStore.getState().step).toBe(0);
  });

  it('nextStep() can go above 6 (no max cap in store)', () => {
    for (let i = 0; i < 10; i++) {
      useBookingStore.getState().nextStep();
    }
    expect(useBookingStore.getState().step).toBe(10);
  });

  it('reset() should return to initial state', () => {
    useBookingStore.getState().setSelectedService('Adult Hair Cut');
    useBookingStore.getState().setSelectedStaff('haiqal');
    useBookingStore.getState().setSelectedDate('d1');
    useBookingStore.getState().setSelectedTime('02:00 PM');
    useBookingStore.getState().setBookingRef('HYC-1234');
    useBookingStore.getState().setIsConfirming(true);
    useBookingStore.getState().setClientSecret('cs_secret');
    useBookingStore.getState().setStep(5);

    useBookingStore.getState().reset();

    const state = useBookingStore.getState();
    expect(state.step).toBe(0);
    expect(state.openCategory).toBe('Haircuts');
    expect(state.selectedService).toBeNull();
    expect(state.selectedStaff).toBeNull();
    expect(state.selectedDate).toBeNull();
    expect(state.selectedTime).toBeNull();
    expect(state.bookingRef).toBe('');
    expect(state.isConfirming).toBe(false);
    expect(state.clientSecret).toBeNull();
  });

  it('prepopulate() should set step 3 with service and staff', () => {
    useBookingStore.getState().prepopulate({ serviceName: 'Beard Trim/Shape', staffId: 'naim' });
    const state = useBookingStore.getState();
    expect(state.step).toBe(3);
    expect(state.selectedService).toBe('Beard Trim/Shape');
    expect(state.selectedStaff).toBe('naim');
  });

  it('should support full booking flow: service then barber then datetime then review', () => {
    const store = useBookingStore.getState();
    store.setSelectedService('Adult Hair Cut');
    expect(useBookingStore.getState().selectedService).toBe('Adult Hair Cut');

    useBookingStore.getState().nextStep();
    expect(useBookingStore.getState().step).toBe(1);

    useBookingStore.getState().setSelectedStaff('haiqal');
    expect(useBookingStore.getState().selectedStaff).toBe('haiqal');

    useBookingStore.getState().nextStep();
    expect(useBookingStore.getState().step).toBe(2);

    useBookingStore.getState().setSelectedDate('d2');
    useBookingStore.getState().setSelectedTime('03:00 PM');
    expect(useBookingStore.getState().selectedDate).toBe('d2');
    expect(useBookingStore.getState().selectedTime).toBe('03:00 PM');

    useBookingStore.getState().nextStep();
    expect(useBookingStore.getState().step).toBe(3);
  });

  it('setStep() should set any step value directly', () => {
    useBookingStore.getState().setStep(6);
    expect(useBookingStore.getState().step).toBe(6);
    useBookingStore.getState().setStep(0);
    expect(useBookingStore.getState().step).toBe(0);
  });

  it('setBookingRef() should update booking reference', () => {
    useBookingStore.getState().setBookingRef('HYC-9999');
    expect(useBookingStore.getState().bookingRef).toBe('HYC-9999');
  });

  it('setIsConfirming() should toggle confirming state', () => {
    useBookingStore.getState().setIsConfirming(true);
    expect(useBookingStore.getState().isConfirming).toBe(true);
    useBookingStore.getState().setIsConfirming(false);
    expect(useBookingStore.getState().isConfirming).toBe(false);
  });

  it('setClientSecret() should update client secret', () => {
    useBookingStore.getState().setClientSecret('cs_live_secret');
    expect(useBookingStore.getState().clientSecret).toBe('cs_live_secret');
    useBookingStore.getState().setClientSecret(null);
    expect(useBookingStore.getState().clientSecret).toBeNull();
  });

  it('setOpenCategory() should update open category', () => {
    useBookingStore.getState().setOpenCategory('Beard');
    expect(useBookingStore.getState().openCategory).toBe('Beard');
    useBookingStore.getState().setOpenCategory(null);
    expect(useBookingStore.getState().openCategory).toBeNull();
  });
});
