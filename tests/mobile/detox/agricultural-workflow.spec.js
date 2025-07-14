describe('Agricultural Workflow - Complete Mobile E2E - Phase 4', () => {
  
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

  // ====== PHASE 3 NEW FEATURES TESTING ======

  it('Weather integration: Alerts and agricultural recommendations', async () => {
    // Navigate to dashboard to see weather widget
    await element(by.id('tab-dashboard')).tap();
    
    // Wait for weather widget to load
    await waitFor(element(by.id('weather-widget')))
      .toBeVisible()
      .withTimeout(15000);
    
    // Verify weather data is displayed
    await expect(element(by.id('current-temperature'))).toBeVisible();
    await expect(element(by.id('weather-description'))).toBeVisible();
    await expect(element(by.id('humidity-display'))).toBeVisible();
    
    // Check for weather alerts section
    const alertsSection = element(by.id('weather-alerts-section'));
    if (await alertsSection.isVisible()) {
      await expect(element(by.id('alert-type'))).toBeVisible();
      await expect(element(by.id('alert-severity'))).toBeVisible();
      
      // Tap alert for details
      await element(by.id('view-alert-details')).tap();
      await expect(element(by.id('alert-description'))).toBeVisible();
      await expect(element(by.id('agricultural-recommendation'))).toBeVisible();
    }
    
    // Test agricultural recommendations
    await element(by.id('view-agricultural-recommendations')).tap();
    await expect(element(by.id('work-field-recommendation'))).toBeVisible();
    await expect(element(by.id('irrigation-recommendation'))).toBeVisible();
    await expect(element(by.id('frost-protection-recommendation'))).toBeVisible();
  });

  it('OCR functionality: Scan agricultural products', async () => {
    await element(by.id('tab-actividades')).tap();
    await element(by.id('add-actividad-button')).tap();
    
    // Test OCR product scanning
    await element(by.id('scan-product-button')).tap();
    await element(by.id('camera-option')).tap();
    
    // Simulate taking photo of product label
    await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);
    await element(by.id('capture-photo-button')).tap();
    
    // Wait for OCR processing
    await waitFor(element(by.id('ocr-processing-complete')))
      .toBeVisible()
      .withTimeout(30000);
    
    // Verify OCR results
    await expect(element(by.id('ocr-results-container'))).toBeVisible();
    
    const productName = element(by.id('detected-product-name'));
    if (await productName.isVisible()) {
      await expect(productName).not.toHaveText('');
    }
    
    const productType = element(by.id('detected-product-type'));
    if (await productType.isVisible()) {
      await expect(productType).toHaveText(/(herbicida|fungicida|fertilizante|semilla)/);
    }
    
    // Apply OCR results to form
    await element(by.id('apply-ocr-results')).tap();
    await expect(element(by.id('actividad-producto-input'))).not.toHaveText('');
  });

  it('Advanced analytics: ROI calculation and business intelligence', async () => {
    // First create some test data
    await element(by.id('tab-actividades')).tap();
    
    const testActivities = [
      { desc: 'Siembra', cost: '300.00', type: 'siembra' },
      { desc: 'Fertilización', cost: '150.50', type: 'fertilizacion' },
      { desc: 'Tratamiento', cost: '200.00', type: 'tratamiento' }
    ];
    
    for (const activity of testActivities) {
      await element(by.id('add-actividad-button')).tap();
      await element(by.id('actividad-descripcion-input')).typeText(activity.desc);
      await element(by.id('actividad-costo-input')).typeText(activity.cost);
      await element(by.id('save-actividad-button')).tap();
    }
    
    // Navigate to analytics
    await element(by.id('tab-analytics')).tap();
    
    // Wait for analytics to load
    await waitFor(element(by.id('analytics-dashboard'))).toBeVisible().withTimeout(10000);
    
    // Verify cost analysis
    await expect(element(by.id('total-costs-card'))).toBeVisible();
    await expect(element(by.text('650.50€'))).toBeVisible(); // Sum of costs
    
    // Check cost breakdown by category
    await expect(element(by.id('cost-breakdown-chart'))).toBeVisible();
    
    // Test profitability analysis
    await element(by.id('profitability-tab')).tap();
    await expect(element(by.id('roi-calculation'))).toBeVisible();
    await expect(element(by.id('cost-per-hectare'))).toBeVisible();
    
    // Test benchmarking
    await element(by.id('benchmarking-tab')).tap();
    await expect(element(by.id('sector-comparison'))).toBeVisible();
    await expect(element(by.text('Comparación sector'))).toBeVisible();
    
    // Test recommendations
    await element(by.id('recommendations-tab')).tap();
    await expect(element(by.id('optimization-recommendations'))).toBeVisible();
  });

  it('WatermelonDB offline sync: Complex scenarios', async () => {
    await simulateOfflineMode();
    
    // Create complex offline operations
    const operations = [
      { type: 'parcela', data: { name: 'Offline Complex 1', surface: '10.0' } },
      { type: 'parcela', data: { name: 'Offline Complex 2', surface: '15.5' } },
      { type: 'actividad', data: { desc: 'Complex Activity 1', cost: '100.00' } },
      { type: 'actividad', data: { desc: 'Complex Activity 2', cost: '200.00' } }
    ];
    
    // Create parcelas offline
    for (const op of operations.filter(o => o.type === 'parcela')) {
      await element(by.id('tab-parcelas')).tap();
      await element(by.id('add-parcela-button')).tap();
      await element(by.id('parcela-nombre-input')).typeText(op.data.name);
      await element(by.id('parcela-superficie-input')).typeText(op.data.surface);
      await element(by.id('save-parcela-button')).tap();
    }
    
    // Create activities offline
    for (const op of operations.filter(o => o.type === 'actividad')) {
      await element(by.id('tab-actividades')).tap();
      await element(by.id('add-actividad-button')).tap();
      await element(by.id('actividad-descripcion-input')).typeText(op.data.desc);
      await element(by.id('actividad-costo-input')).typeText(op.data.cost);
      await element(by.id('save-actividad-button')).tap();
    }
    
    // Check sync queue
    await element(by.id('sync-queue-button')).tap();
    await expect(element(by.text('4 operaciones pendientes'))).toBeVisible();
    
    // Verify queue priorities
    await expect(element(by.id('high-priority-operations'))).toBeVisible();
    await expect(element(by.id('normal-priority-operations'))).toBeVisible();
    
    await simulateOnlineMode();
    
    // Trigger batch sync
    await element(by.id('sync-all-button')).tap();
    
    // Monitor sync progress
    await expect(element(by.id('sync-progress-indicator'))).toBeVisible();
    await waitFor(element(by.text('Sincronización completada')))
      .toBeVisible()
      .withTimeout(30000);
    
    // Verify all operations synced
    await expect(element(by.text('0 operaciones pendientes'))).toBeVisible();
  });

  it('SIGPAC integration: Reference validation on mobile', async () => {
    await element(by.id('tab-parcelas')).tap();
    await element(by.id('add-parcela-button')).tap();
    
    // Test SIGPAC reference input
    await element(by.id('sigpac-reference-input')).typeText('28:079:0001:00001:0001:WX');
    await element(by.id('validate-sigpac-button')).tap();
    
    // Wait for SIGPAC validation
    await waitFor(element(by.id('sigpac-validation-result')))
      .toBeVisible()
      .withTimeout(15000);
    
    // Verify validation results
    await expect(element(by.id('sigpac-province'))).toHaveText('Madrid');
    await expect(element(by.id('sigpac-municipality'))).toBeVisible();
    await expect(element(by.id('sigpac-surface'))).toBeVisible();
    
    // Test auto-filling coordinates from SIGPAC
    const autoFillButton = element(by.id('auto-fill-coordinates'));
    if (await autoFillButton.isVisible()) {
      await autoFillButton.tap();
      await expect(element(by.id('latitude-input'))).not.toHaveText('');
      await expect(element(by.id('longitude-input'))).not.toHaveText('');
    }
    
    // Test invalid SIGPAC reference
    await element(by.id('sigpac-reference-input')).clearText();
    await element(by.id('sigpac-reference-input')).typeText('INVALID:REFERENCE');
    await element(by.id('validate-sigpac-button')).tap();
    
    await waitFor(element(by.id('sigpac-error-message')))
      .toBeVisible()
      .withTimeout(10000);
    
    await expect(element(by.text(/inválida|error/))).toBeVisible();
  });

  it('Performance: Phase 3 features under load', async () => {
    const startTime = Date.now();
    
    // Test weather widget loading performance
    await element(by.id('tab-dashboard')).tap();
    await waitFor(element(by.id('weather-widget'))).toBeVisible().withTimeout(5000);
    
    const weatherLoadTime = Date.now() - startTime;
    expect(weatherLoadTime).toBeLessThan(5000); // Weather should load within 5 seconds
    
    // Test analytics performance with data
    const analyticsStartTime = Date.now();
    await element(by.id('tab-analytics')).tap();
    await waitFor(element(by.id('analytics-dashboard'))).toBeVisible().withTimeout(8000);
    
    const analyticsLoadTime = Date.now() - analyticsStartTime;
    expect(analyticsLoadTime).toBeLessThan(8000); // Analytics should load within 8 seconds
    
    // Test sync performance
    await simulateOfflineMode();
    
    // Create multiple operations quickly
    for (let i = 0; i < 5; i++) {
      await element(by.id('tab-actividades')).tap();
      await element(by.id('add-actividad-button')).tap();
      await element(by.id('actividad-descripcion-input')).typeText(`Performance Test ${i}`);
      await element(by.id('save-actividad-button')).tap();
    }
    
    await simulateOnlineMode();
    
    const syncStartTime = Date.now();
    await element(by.id('sync-all-button')).tap();
    await waitFor(element(by.text('Sincronización completada')))
      .toBeVisible()
      .withTimeout(15000);
    
    const syncTime = Date.now() - syncStartTime;
    expect(syncTime).toBeLessThan(15000); // Sync should complete within 15 seconds
    
    console.log(`Performance metrics - Weather: ${weatherLoadTime}ms, Analytics: ${analyticsLoadTime}ms, Sync: ${syncTime}ms`);
  });

  it('Network resilience: Intermittent connectivity', async () => {
    // Start online
    await element(by.id('tab-actividades')).tap();
    await element(by.id('add-actividad-button')).tap();
    await element(by.id('actividad-descripcion-input')).typeText('Network Test Activity');
    
    // Go offline while saving
    await simulateOfflineMode();
    await element(by.id('save-actividad-button')).tap();
    
    // Verify offline save worked
    await expect(element(by.id('offline-save-indicator'))).toBeVisible();
    
    // Simulate intermittent connectivity
    await simulateOnlineMode();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await simulateOfflineMode();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await simulateOnlineMode();
    
    // Trigger sync during unstable connection
    await element(by.id('sync-button')).tap();
    
    // Verify resilient sync behavior
    await waitFor(element(by.id('sync-retry-indicator')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Eventually should succeed
    await waitFor(element(by.text('Sincronización exitosa')))
      .toBeVisible()
      .withTimeout(30000);
  });
});