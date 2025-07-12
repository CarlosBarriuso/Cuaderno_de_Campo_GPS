describe('Offline Synchronization - Mobile E2E', () => {
  
  beforeEach(async () => {
    await device.reloadReactNative();
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('WatermelonDB operations work offline', async () => {
    await simulateOfflineMode();
    
    // Test creating parcela offline
    await element(by.id('tab-parcelas')).tap();
    await element(by.id('add-parcela-button')).tap();
    
    await element(by.id('parcela-nombre-input')).typeText('Offline Parcela');
    await element(by.id('parcela-superficie-input')).typeText('10.5');
    await element(by.id('save-parcela-button')).tap();
    
    // Verify parcela exists in local database
    await expect(element(by.text('Offline Parcela'))).toBeVisible();
    await expect(element(by.id('offline-indicator'))).toBeVisible();
    
    // Test reading parcelas offline
    await element(by.id('refresh-parcelas')).tap();
    await expect(element(by.text('Offline Parcela'))).toBeVisible();
    
    // Test updating parcela offline
    await element(by.text('Offline Parcela')).tap();
    await element(by.id('edit-parcela-button')).tap();
    await element(by.id('parcela-superficie-input')).clearText();
    await element(by.id('parcela-superficie-input')).typeText('12.0');
    await element(by.id('save-parcela-button')).tap();
    
    // Verify update was saved locally
    await expect(element(by.text('12.0 ha'))).toBeVisible();
    
    await simulateOnlineMode();
  });

  it('Sync queue manages operations correctly', async () => {
    await simulateOfflineMode();
    
    // Create multiple operations while offline
    const operations = [
      { type: 'parcela', name: 'Sync Test 1' },
      { type: 'parcela', name: 'Sync Test 2' },
      { type: 'actividad', name: 'Offline Activity 1' },
      { type: 'actividad', name: 'Offline Activity 2' }
    ];
    
    // Create parcelas
    for (const op of operations.filter(o => o.type === 'parcela')) {
      await element(by.id('tab-parcelas')).tap();
      await element(by.id('add-parcela-button')).tap();
      await element(by.id('parcela-nombre-input')).typeText(op.name);
      await element(by.id('parcela-superficie-input')).typeText('5.0');
      await element(by.id('save-parcela-button')).tap();
    }
    
    // Create activities
    for (const op of operations.filter(o => o.type === 'actividad')) {
      await element(by.id('tab-actividades')).tap();
      await element(by.id('add-actividad-button')).tap();
      await element(by.id('actividad-descripcion-input')).typeText(op.name);
      await element(by.id('save-actividad-button')).tap();
    }
    
    // Check sync queue status
    await element(by.id('sync-status-button')).tap();
    await expect(element(by.text('4 operaciones pendientes'))).toBeVisible();
    
    // Verify queue details
    await expect(element(by.text('2 parcelas pendientes'))).toBeVisible();
    await expect(element(by.text('2 actividades pendientes'))).toBeVisible();
    
    await simulateOnlineMode();
    
    // Trigger sync
    await element(by.id('manual-sync-button')).tap();
    
    // Wait for all operations to sync
    await waitFor(element(by.text('Todas las operaciones sincronizadas')))
      .toBeVisible()
      .withTimeout(20000);
    
    // Verify queue is empty
    await expect(element(by.text('0 operaciones pendientes'))).toBeVisible();
  });

  it('Auto-sync works when connectivity is restored', async () => {
    await simulateOfflineMode();
    
    // Create operation while offline
    await element(by.id('tab-parcelas')).tap();
    await element(by.id('add-parcela-button')).tap();
    await element(by.id('parcela-nombre-input')).typeText('Auto Sync Test');
    await element(by.id('parcela-superficie-input')).typeText('8.0');
    await element(by.id('save-parcela-button')).tap();
    
    // Verify offline indicator
    await expect(element(by.id('offline-indicator'))).toBeVisible();
    await expect(element(by.id('sync-pending-badge'))).toHaveText('1');
    
    // Go back online - should trigger auto-sync
    await simulateOnlineMode();
    
    // Wait for auto-sync to complete
    await waitFor(element(by.id('auto-sync-completed')))
      .toBeVisible()
      .withTimeout(15000);
    
    // Verify sync completed
    await expect(element(by.id('offline-indicator'))).not.toBeVisible();
    await expect(element(by.id('sync-pending-badge'))).not.toBeVisible();
    await expect(element(by.id('synced-indicator'))).toBeVisible();
  });

  it('Conflict resolution handles data conflicts', async () => {
    // Setup: Create parcela online first
    await element(by.id('tab-parcelas')).tap();
    await element(by.id('add-parcela-button')).tap();
    await element(by.id('parcela-nombre-input')).typeText('Conflict Test');
    await element(by.id('parcela-superficie-input')).typeText('10.0');
    await element(by.id('save-parcela-button')).tap();
    
    // Wait for initial sync
    await waitFor(element(by.id('synced-indicator'))).toBeVisible().withTimeout(5000);
    
    // Go offline and modify locally
    await simulateOfflineMode();
    await element(by.text('Conflict Test')).tap();
    await element(by.id('edit-parcela-button')).tap();
    await element(by.id('parcela-superficie-input')).clearText();
    await element(by.id('parcela-superficie-input')).typeText('15.0'); // Local change
    await element(by.id('save-parcela-button')).tap();
    
    // Simulate server-side change (would be done via external API in real test)
    // For this test, we'll assume server changed it to 12.0
    
    await simulateOnlineMode();
    
    // Trigger sync - should detect conflict
    await element(by.id('manual-sync-button')).tap();
    
    // Wait for conflict resolution dialog
    await waitFor(element(by.id('sync-conflict-dialog')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Check conflict details
    await expect(element(by.text('Conflicto detectado'))).toBeVisible();
    await expect(element(by.text('Valor local: 15.0'))).toBeVisible();
    await expect(element(by.text('Valor servidor: 12.0'))).toBeVisible();
    
    // Choose resolution strategy
    await element(by.id('keep-local-button')).tap();
    
    // Verify resolution
    await expect(element(by.text('Conflicto resuelto'))).toBeVisible();
    await expect(element(by.text('15.0 ha'))).toBeVisible();
  });

  it('Sync performance with large datasets', async () => {
    await simulateOfflineMode();
    
    // Create many operations offline
    const startTime = Date.now();
    
    for (let i = 1; i <= 20; i++) {
      await element(by.id('tab-parcelas')).tap();
      await element(by.id('add-parcela-button')).tap();
      await element(by.id('parcela-nombre-input')).typeText(`Bulk Test ${i}`);
      await element(by.id('parcela-superficie-input')).typeText('1.0');
      await element(by.id('save-parcela-button')).tap();
    }
    
    const creationTime = Date.now() - startTime;
    expect(creationTime).toBeLessThan(30000); // Should create 20 parcelas in under 30 seconds
    
    // Check sync queue
    await element(by.id('sync-status-button')).tap();
    await expect(element(by.text('20 operaciones pendientes'))).toBeVisible();
    
    await simulateOnlineMode();
    
    // Time the sync operation
    const syncStartTime = Date.now();
    await element(by.id('manual-sync-button')).tap();
    
    await waitFor(element(by.text('Todas las operaciones sincronizadas')))
      .toBeVisible()
      .withTimeout(45000);
    
    const syncTime = Date.now() - syncStartTime;
    expect(syncTime).toBeLessThan(30000); // Should sync 20 items in under 30 seconds
    
    console.log(`Bulk sync performance: ${syncTime}ms for 20 operations`);
  });

  it('Retry mechanism for failed sync operations', async () => {
    await simulateOfflineMode();
    
    // Create operation that will fail initially
    await element(by.id('tab-parcelas')).tap();
    await element(by.id('add-parcela-button')).tap();
    await element(by.id('parcela-nombre-input')).typeText('Retry Test');
    await element(by.id('parcela-superficie-input')).typeText('7.5');
    await element(by.id('save-parcela-button')).tap();
    
    // Go online but simulate server error
    await simulateOnlineMode();
    // Note: In real test, would mock API to return error
    
    await element(by.id('manual-sync-button')).tap();
    
    // Wait for retry mechanism to kick in
    await waitFor(element(by.id('sync-retry-indicator')))
      .toBeVisible()
      .withTimeout(10000);
    
    await expect(element(by.text('Reintentando...'))).toBeVisible();
    
    // Simulate server recovery
    // Note: In real test, would restore API functionality
    
    // Wait for successful retry
    await waitFor(element(by.text('Sincronización exitosa')))
      .toBeVisible()
      .withTimeout(30000);
    
    await expect(element(by.id('synced-indicator'))).toBeVisible();
  });

  it('Bandwidth optimization for rural connections', async () => {
    await simulateOfflineMode();
    
    // Create various types of data
    await element(by.id('tab-parcelas')).tap();
    await element(by.id('add-parcela-button')).tap();
    await element(by.id('parcela-nombre-input')).typeText('Bandwidth Test');
    await element(by.id('parcela-superficie-input')).typeText('25.0');
    
    // Add photo (large data)
    await element(by.id('add-photo-button')).tap();
    await element(by.id('take-photo-option')).tap();
    await element(by.id('capture-photo-button')).tap();
    
    await element(by.id('save-parcela-button')).tap();
    
    // Create activity with multiple photos
    await element(by.id('tab-actividades')).tap();
    await element(by.id('add-actividad-button')).tap();
    await element(by.id('actividad-descripcion-input')).typeText('Heavy data activity');
    
    // Add multiple photos
    for (let i = 0; i < 3; i++) {
      await element(by.id('add-photo-button')).tap();
      await element(by.id('take-photo-option')).tap();
      await element(by.id('capture-photo-button')).tap();
    }
    
    await element(by.id('save-actividad-button')).tap();
    
    await simulateOnlineMode();
    
    // Enable bandwidth optimization
    await element(by.id('sync-settings-button')).tap();
    await element(by.id('bandwidth-optimization-toggle')).tap();
    await element(by.id('compress-images-toggle')).tap();
    
    // Start sync and monitor progress
    await element(by.id('manual-sync-button')).tap();
    
    // Verify optimization indicators
    await expect(element(by.id('compression-active-indicator'))).toBeVisible();
    await expect(element(by.id('batch-upload-indicator'))).toBeVisible();
    
    // Should complete despite large data
    await waitFor(element(by.text('Sincronización optimizada completada')))
      .toBeVisible()
      .withTimeout(60000);
  });

  it('Sync statistics and monitoring', async () => {
    await simulateOfflineMode();
    
    // Create mixed operations
    const operations = [
      { screen: 'parcelas', action: 'create' },
      { screen: 'parcelas', action: 'update' },
      { screen: 'actividades', action: 'create' },
      { screen: 'actividades', action: 'create' }
    ];
    
    for (const op of operations) {
      if (op.screen === 'parcelas') {
        await element(by.id('tab-parcelas')).tap();
        if (op.action === 'create') {
          await element(by.id('add-parcela-button')).tap();
          await element(by.id('parcela-nombre-input')).typeText('Stats Test');
          await element(by.id('parcela-superficie-input')).typeText('3.0');
          await element(by.id('save-parcela-button')).tap();
        }
      } else {
        await element(by.id('tab-actividades')).tap();
        await element(by.id('add-actividad-button')).tap();
        await element(by.id('actividad-descripcion-input')).typeText('Stats Activity');
        await element(by.id('save-actividad-button')).tap();
      }
    }
    
    // Check sync statistics
    await element(by.id('sync-stats-button')).tap();
    
    await expect(element(by.text('Operaciones pendientes: 4'))).toBeVisible();
    await expect(element(by.text('Creaciones: 3'))).toBeVisible();
    await expect(element(by.text('Actualizaciones: 1'))).toBeVisible();
    
    await simulateOnlineMode();
    await element(by.id('manual-sync-button')).tap();
    
    // Monitor sync progress
    await expect(element(by.id('sync-progress-bar'))).toBeVisible();
    await expect(element(by.text('Sincronizando... 0/4'))).toBeVisible();
    
    // Wait for completion and check final stats
    await waitFor(element(by.text('Sincronización completada')))
      .toBeVisible()
      .withTimeout(20000);
    
    await element(by.id('sync-stats-button')).tap();
    await expect(element(by.text('Última sincronización: Exitosa'))).toBeVisible();
    await expect(element(by.text('Total sincronizado: 4 operaciones'))).toBeVisible();
    await expect(element(by.text('Tiempo: '))).toBeVisible();
  });
});