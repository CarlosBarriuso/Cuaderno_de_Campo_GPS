describe('Agricultural Workflow - Mobile E2E', () => {
  
  beforeEach(async () => {
    await device.reloadReactNative();
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('Complete agricultural workflow: Registration → GPS → Activity → Sync', async () => {
    // Step 1: App launches and shows dashboard
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
    await expect(element(by.text('Cuaderno de Campo GPS'))).toBeVisible();
    
    // Step 2: Navigate to parcelas
    await element(by.id('tab-parcelas')).tap();
    await expect(element(by.id('parcelas-screen'))).toBeVisible();
    
    // Step 3: Create new parcela
    await element(by.id('add-parcela-button')).tap();
    await expect(element(by.id('parcela-form'))).toBeVisible();
    
    // Fill parcela form
    await element(by.id('parcela-nombre-input')).typeText(testParcela.nombre);
    await element(by.id('parcela-superficie-input')).typeText(testParcela.superficie.toString());
    await element(by.id('parcela-cultivo-picker')).tap();
    await element(by.text('Trigo')).tap();
    
    // Test GPS functionality
    await element(by.id('get-gps-location-button')).tap();
    await waitFor(element(by.id('gps-coordinates-display')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Verify GPS coordinates are set
    await expect(element(by.id('latitude-value'))).toHaveText(testParcela.coordenadas.latitude.toString());
    await expect(element(by.id('longitude-value'))).toHaveText(testParcela.coordenadas.longitude.toString());
    
    // Save parcela
    await element(by.id('save-parcela-button')).tap();
    
    // Verify parcela was created
    await expect(element(by.text(testParcela.nombre))).toBeVisible();
    await expect(element(by.id('parcela-created-success'))).toBeVisible();
  });

  it('Offline sync workflow: Create activity offline → sync when online', async () => {
    // Step 1: Simulate offline mode
    await simulateOfflineMode();
    
    // Step 2: Navigate to activities
    await element(by.id('tab-actividades')).tap();
    await expect(element(by.id('actividades-screen'))).toBeVisible();
    
    // Verify offline indicator is shown
    await expect(element(by.id('offline-indicator'))).toBeVisible();
    
    // Step 3: Create activity while offline
    await element(by.id('add-actividad-button')).tap();
    await expect(element(by.id('actividad-form'))).toBeVisible();
    
    // Fill activity form
    await element(by.id('actividad-parcela-picker')).tap();
    await element(by.text(testParcela.nombre)).tap();
    
    await element(by.id('actividad-tipo-picker')).tap();
    await element(by.text('Siembra')).tap();
    
    await element(by.id('actividad-fecha-input')).typeText(testActividad.fecha);
    await element(by.id('actividad-descripcion-input')).typeText(testActividad.descripcion);
    await element(by.id('actividad-producto-input')).typeText(testActividad.producto);
    await element(by.id('actividad-cantidad-input')).typeText(testActividad.cantidad.toString());
    
    // Save activity (should work offline)
    await element(by.id('save-actividad-button')).tap();
    
    // Verify activity was saved locally
    await expect(element(by.text(testActividad.descripcion))).toBeVisible();
    await expect(element(by.id('offline-pending-indicator'))).toBeVisible();
    
    // Step 4: Check sync queue
    await element(by.id('sync-status-button')).tap();
    await expect(element(by.id('sync-queue-screen'))).toBeVisible();
    await expect(element(by.text('1 operación pendiente'))).toBeVisible();
    
    // Step 5: Simulate going back online
    await simulateOnlineMode();
    
    // Step 6: Trigger manual sync
    await element(by.id('manual-sync-button')).tap();
    
    // Wait for sync to complete
    await waitFor(element(by.id('sync-completed-indicator')))
      .toBeVisible()
      .withTimeout(15000);
    
    // Verify activity is now synced
    await expect(element(by.id('offline-pending-indicator'))).not.toBeVisible();
    await expect(element(by.id('synced-indicator'))).toBeVisible();
  });

  it('GPS accuracy and location services', async () => {
    // Test GPS permissions and accuracy
    await element(by.id('tab-configuracion')).tap();
    await element(by.id('gps-settings-button')).tap();
    
    // Request location permissions
    await element(by.id('request-location-permission')).tap();
    
    // Test GPS accuracy
    await element(by.id('test-gps-accuracy')).tap();
    
    // Wait for GPS test results
    await waitFor(element(by.id('gps-accuracy-result')))
      .toBeVisible()
      .withTimeout(20000);
    
    // Verify accuracy is within acceptable range (1-3 meters)
    const accuracyText = await element(by.id('gps-accuracy-value')).getAttributes();
    const accuracy = parseFloat(accuracyText.text);
    expect(accuracy).toBeLessThan(5); // 5 meters max for agricultural use
    
    // Test coordinates precision
    await element(by.id('get-precise-location')).tap();
    await waitFor(element(by.id('precise-coordinates')))
      .toBeVisible()
      .withTimeout(15000);
    
    // Verify coordinates format
    await expect(element(by.id('latitude-precision'))).toHaveText(/^\d{2}\.\d{4,}$/);
    await expect(element(by.id('longitude-precision'))).toHaveText(/^-?\d{1,2}\.\d{4,}$/);
  });

  it('Camera and photo capture for activity documentation', async () => {
    // Navigate to create activity
    await element(by.id('tab-actividades')).tap();
    await element(by.id('add-actividad-button')).tap();
    
    // Fill basic activity info
    await element(by.id('actividad-tipo-picker')).tap();
    await element(by.text('Aplicación fitosanitario')).tap();
    
    // Test photo capture
    await element(by.id('add-photo-button')).tap();
    await element(by.id('take-photo-option')).tap();
    
    // Simulate camera capture (in real test, would use device camera)
    await waitFor(element(by.id('camera-view')))
      .toBeVisible()
      .withTimeout(5000);
    
    await element(by.id('capture-photo-button')).tap();
    
    // Verify photo was captured and attached
    await expect(element(by.id('activity-photo-thumbnail'))).toBeVisible();
    await expect(element(by.id('photo-count-indicator'))).toHaveText('1 foto');
    
    // Test multiple photos
    await element(by.id('add-photo-button')).tap();
    await element(by.id('take-photo-option')).tap();
    await element(by.id('capture-photo-button')).tap();
    
    await expect(element(by.id('photo-count-indicator'))).toHaveText('2 fotos');
  });

  it('Offline map functionality and parcela visualization', async () => {
    // Navigate to map
    await element(by.id('tab-mapa')).tap();
    await expect(element(by.id('map-screen'))).toBeVisible();
    
    // Wait for map to load
    await waitFor(element(by.id('map-container')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Test offline map tiles are available
    await simulateOfflineMode();
    
    // Verify map still functions offline
    await expect(element(by.id('map-container'))).toBeVisible();
    await expect(element(by.id('offline-map-indicator'))).toBeVisible();
    
    // Test parcela markers are visible
    await expect(element(by.id('parcela-marker'))).toBeVisible();
    
    // Test map interactions offline
    await element(by.id('zoom-in-button')).tap();
    await element(by.id('zoom-out-button')).tap();
    
    // Test parcela details popup
    await element(by.id('parcela-marker')).tap();
    await expect(element(by.id('parcela-popup'))).toBeVisible();
    await expect(element(by.text(testParcela.nombre))).toBeVisible();
    
    await simulateOnlineMode();
  });

  it('Sync conflict resolution', async () => {
    // Create conflicting changes scenario
    await simulateOfflineMode();
    
    // Create activity offline
    await element(by.id('tab-actividades')).tap();
    await element(by.id('add-actividad-button')).tap();
    
    // Fill and save activity
    await element(by.id('actividad-descripcion-input')).typeText('Conflicting activity');
    await element(by.id('save-actividad-button')).tap();
    
    // Simulate server-side changes while offline
    // (This would be done by external API calls in real scenario)
    
    await simulateOnlineMode();
    
    // Trigger sync - should detect conflicts
    await element(by.id('manual-sync-button')).tap();
    
    // Wait for conflict resolution dialog
    await waitFor(element(by.id('sync-conflict-dialog')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Choose resolution strategy
    await element(by.id('keep-local-changes')).tap();
    
    // Verify conflict was resolved
    await expect(element(by.id('conflict-resolved-message'))).toBeVisible();
    await expect(element(by.text('Conflicting activity'))).toBeVisible();
  });

  it('Performance: App responds quickly under load', async () => {
    // Test app performance with multiple operations
    const startTime = Date.now();
    
    // Navigate through all tabs quickly
    await element(by.id('tab-dashboard')).tap();
    await element(by.id('tab-parcelas')).tap();
    await element(by.id('tab-actividades')).tap();
    await element(by.id('tab-mapa')).tap();
    await element(by.id('tab-dashboard')).tap();
    
    const navigationTime = Date.now() - startTime;
    expect(navigationTime).toBeLessThan(2000); // Should complete in under 2 seconds
    
    // Test scrolling performance with many items
    await element(by.id('tab-actividades')).tap();
    await element(by.id('actividades-list')).scroll(500, 'down');
    await element(by.id('actividades-list')).scroll(500, 'up');
    
    // Test form performance
    const formStartTime = Date.now();
    await element(by.id('add-actividad-button')).tap();
    await element(by.id('actividad-descripcion-input')).typeText('Performance test activity');
    await element(by.id('save-actividad-button')).tap();
    
    const formTime = Date.now() - formStartTime;
    expect(formTime).toBeLessThan(3000); // Form operations should be quick
  });

  it('Memory usage stays reasonable', async () => {
    // Perform memory-intensive operations
    for (let i = 0; i < 10; i++) {
      // Create and navigate between screens
      await element(by.id('tab-mapa')).tap();
      await waitFor(element(by.id('map-container'))).toBeVisible().withTimeout(5000);
      
      await element(by.id('tab-actividades')).tap();
      await element(by.id('add-actividad-button')).tap();
      await element(by.id('cancel-actividad-button')).tap();
    }
    
    // App should still be responsive
    await element(by.id('tab-dashboard')).tap();
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
    
    // No memory warnings should appear
    await expect(element(by.id('memory-warning'))).not.toBeVisible();
  });
});