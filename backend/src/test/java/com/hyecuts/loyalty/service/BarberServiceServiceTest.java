package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.exception.InvalidRequestException;
import com.hyecuts.loyalty.model.BarberService;
import com.hyecuts.loyalty.repository.BarberServiceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BarberServiceServiceTest {

    @Mock private BarberServiceRepository repository;

    @InjectMocks private BarberServiceService barberServiceService;

    private static BarberService service(long id, String name, boolean active) {
        BarberService service = new BarberService();
        service.setId(id);
        service.setName(name);
        service.setPriceMyr(new BigDecimal("25.00"));
        service.setBasePoints(25);
        service.setDurationMinutes(30);
        service.setIsActive(active);
        return service;
    }

    @Test
    void getActiveServices_usesTheActiveOnlyQuery() {
        List<BarberService> active = List.of(service(1, "Adult Hair Cut", true));
        when(repository.findByIsActiveTrue()).thenReturn(active);

        assertEquals(active, barberServiceService.getActiveServices());
        // Customers must never be offered a deactivated service.
        verify(repository, never()).findAll();
    }

    @Test
    void getActiveServices_emptyWhenEverythingIsDeactivated() {
        when(repository.findByIsActiveTrue()).thenReturn(List.of());

        assertTrue(barberServiceService.getActiveServices().isEmpty());
    }

    @Test
    void getAllServices_includesDeactivatedOnesForTheAdminList() {
        List<BarberService> all = List.of(service(1, "Adult Hair Cut", true), service(2, "Hair Colour", false));
        when(repository.findAll()).thenReturn(all);

        assertEquals(all, barberServiceService.getAllServices());
    }

    @Test
    void getServiceById_returnsTheService() {
        BarberService cut = service(1, "Adult Hair Cut", true);
        when(repository.findById(1L)).thenReturn(Optional.of(cut));

        assertEquals(Optional.of(cut), barberServiceService.getServiceById(1L));
    }

    @Test
    void getServiceById_emptyForAnUnknownId() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertTrue(barberServiceService.getServiceById(99L).isEmpty());
    }

    @Test
    void saveService_savesAndReturnsThePersistedService() {
        BarberService input = service(0, "Beard Trim/Shape", true);
        BarberService saved = service(7, "Beard Trim/Shape", true);
        when(repository.save(input)).thenReturn(saved);

        assertSame(saved, barberServiceService.saveService(input));
    }

    private void assertRejected(BarberService input, String messageFragment) {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> barberServiceService.saveService(input));
        assertTrue(ex.getMessage().contains(messageFragment), ex.getMessage());
        verify(repository, never()).save(any(BarberService.class));
    }

    @Test
    void saveService_trimsTheNameDefaultsToActiveAndIgnoresAClientSuppliedId() {
        when(repository.save(any(BarberService.class))).thenAnswer(inv -> inv.getArgument(0));
        BarberService input = service(1, "  Hot Towel Shave  ", true);
        input.setIsActive(null);

        BarberService saved = barberServiceService.saveService(input);

        assertEquals("Hot Towel Shave", saved.getName());
        assertTrue(saved.getIsActive());
        // An id in the body must not overwrite the existing service with that id.
        assertNull(saved.getId());
    }

    @Test
    void saveService_allowsAFreeService() {
        when(repository.save(any(BarberService.class))).thenAnswer(inv -> inv.getArgument(0));
        BarberService input = service(0, "Consultation", true);
        input.setPriceMyr(BigDecimal.ZERO);

        assertEquals(BigDecimal.ZERO, barberServiceService.saveService(input).getPriceMyr());
    }

    @Test
    void saveService_rejectsAMissingOrBlankName() {
        assertRejected(service(0, null, true), "name is required");
        assertRejected(service(0, "  ", true), "name is required");
    }

    @Test
    void saveService_rejectsADuplicateNameInAnyCasing() {
        when(repository.existsByNameIgnoreCase("adult hair cut")).thenReturn(true);
        assertRejected(service(0, "adult hair cut", true), "already exists");
    }

    @Test
    void saveService_rejectsANegativeOrMissingPrice() {
        BarberService negative = service(0, "Cut", true);
        negative.setPriceMyr(new BigDecimal("-1.00"));
        BarberService missing = service(0, "Cut", true);
        missing.setPriceMyr(null);
        assertRejected(negative, "Price");
        assertRejected(missing, "Price");
    }

    @Test
    void saveService_rejectsFractionsOfASen() {
        BarberService input = service(0, "Cut", true);
        input.setPriceMyr(new BigDecimal("25.555"));
        assertRejected(input, "two decimal places");
    }

    @Test
    void saveService_acceptsTrailingZerosBeyondTwoDecimals() {
        when(repository.save(any(BarberService.class))).thenAnswer(inv -> inv.getArgument(0));
        BarberService input = service(0, "Cut", true);
        input.setPriceMyr(new BigDecimal("25.500"));

        assertNotNull(barberServiceService.saveService(input));
    }

    @Test
    void saveService_rejectsAZeroOrMissingDuration() {
        BarberService zero = service(0, "Cut", true);
        zero.setDurationMinutes(0);
        BarberService missing = service(0, "Cut", true);
        missing.setDurationMinutes(null);
        assertRejected(zero, "Duration");
        assertRejected(missing, "Duration");
    }

    @Test
    void saveService_rejectsNegativeBasePoints() {
        BarberService input = service(0, "Cut", true);
        input.setBasePoints(-5);
        assertRejected(input, "Base points");
    }

    @Test
    void deactivateService_marksItInactiveAndSaves() {
        BarberService cut = service(1, "Adult Hair Cut", true);
        when(repository.findById(1L)).thenReturn(Optional.of(cut));

        barberServiceService.deactivateService(1L);

        assertFalse(cut.getIsActive());
        verify(repository).save(cut);
    }

    @Test
    void deactivateService_keepsTheRestOfTheServiceUnchanged() {
        BarberService cut = service(1, "Adult Hair Cut", true);
        when(repository.findById(1L)).thenReturn(Optional.of(cut));

        barberServiceService.deactivateService(1L);

        // Deactivation is a soft delete: past bookings still reference this row.
        assertEquals("Adult Hair Cut", cut.getName());
        assertEquals(new BigDecimal("25.00"), cut.getPriceMyr());
        verify(repository, never()).delete(any(BarberService.class));
        verify(repository, never()).deleteById(any());
    }

    @Test
    void deactivateService_alreadyInactiveStaysInactive() {
        BarberService colour = service(2, "Hair Colour", false);
        when(repository.findById(2L)).thenReturn(Optional.of(colour));

        barberServiceService.deactivateService(2L);

        assertFalse(colour.getIsActive());
    }

    @Test
    void deactivateService_unknownIdSavesNothing() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        barberServiceService.deactivateService(99L);

        verify(repository, never()).save(any(BarberService.class));
    }
}
