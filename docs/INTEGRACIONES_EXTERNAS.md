# Integraciones Externas y APIs - Cuaderno de Campo GPS

## Resumen de Integraciones

El sistema requiere conexión con múltiples servicios externos para proporcionar funcionalidades completas de gestión agrícola. Este documento detalla cada integración, su implementación técnica y estrategias de fallback.

## 1. Integración SIGPAC (Sistema de Información Geográfica de Parcelas Agrícolas)

### Contexto
SIGPAC es el sistema oficial español que contiene información geográfica de todas las parcelas agrícolas. Es esencial para:
- Importación automática de geometrías oficiales
- Validación de referencias catastrales
- Cumplimiento normativo PAC
- Verificación de superficies declaradas

### Estado de APIs Disponibles
**Problema**: No existe API pública oficial unificada para SIGPAC
**Solución**: Estrategia híbrida con múltiples fuentes

#### Fuentes de Datos SIGPAC
1. **WMS Services** (Servicios Web de Mapas)
2. **Portales Autonómicos** (APIs regionales)
3. **Scraping Controlado** (último recurso)
4. **Datasets Estáticos** (backup offline)

### Implementación Técnica

#### 1. Cliente WMS para Cartografía
```typescript
// services/sigpac/wmsClient.ts
export class SIGPACWMSClient {
  private readonly WMS_ENDPOINTS = {
    nacional: 'https://wms.mapama.gob.es/wms/wms.aspx',
    andalucia: 'https://www.juntadeandalucia.es/medioambiente/site/wms',
    castilla_leon: 'http://servicios.jcyl.es/wms/wms_sigpac'
  };

  async getParcelaGeometry(referencia: string): Promise<SIGPACParcela | null> {
    const [provincia, municipio, agregado, zona, parcela, recinto] = 
      this.parseReferencia(referencia);

    try {
      // Intentar endpoint nacional primero
      let result = await this.queryWMS('nacional', {
        provincia,
        municipio,
        agregado,
        zona,
        parcela,
        recinto
      });

      if (!result) {
        // Fallback a endpoints autonómicos
        const autonomia = this.getAutonomiaByProvincia(provincia);
        result = await this.queryWMS(autonomia, {
          provincia,
          municipio,
          agregado,
          zona,
          parcela,
          recinto
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Error querying SIGPAC WMS', { referencia, error });
      throw new SIGPACError('WMS_QUERY_FAILED', error.message);
    }
  }

  private async queryWMS(endpoint: keyof typeof this.WMS_ENDPOINTS, params: SIGPACParams): Promise<SIGPACParcela | null> {
    const wmsUrl = this.buildWMSUrl(endpoint, params);
    
    const response = await fetch(wmsUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'CuadernoCampoGPS/1.0 (+https://cuadernocampo.es)'
      }
    });

    if (!response.ok) {
      throw new Error(`WMS request failed: ${response.status}`);
    }

    const geoJSON = await response.json();
    return this.transformWMSResponse(geoJSON);
  }

  private buildWMSUrl(endpoint: string, params: SIGPACParams): string {
    const baseUrl = this.WMS_ENDPOINTS[endpoint];
    const wmsParams = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetFeature',
      TYPENAME: 'Recintos',
      OUTPUTFORMAT: 'application/json',
      CQL_FILTER: `provincia='${params.provincia}' AND municipio='${params.municipio}' AND agregado='${params.agregado}' AND zona='${params.zona}' AND parcela='${params.parcela}' AND recinto='${params.recinto}'`
    });

    return `${baseUrl}?${wmsParams.toString()}`;
  }
}
```

#### 2. Scraper para Portales Web
```typescript
// services/sigpac/webScraper.ts
export class SIGPACWebScraper {
  private readonly PORTAL_URLS = {
    fega: 'https://sigpac.mapa.gob.es/fega/visor/',
    andalucia: 'https://www.juntadeandalucia.es/agriculturaypesca/sigpac/',
    castilla_la_mancha: 'https://crea.castillalamancha.es/sigpac'
  };

  async scrapeParcelaData(referencia: string): Promise<SIGPACParcela | null> {
    // Solo usar si WMS falla y es crítico
    if (!this.shouldUseScraping()) {
      throw new Error('Scraping disabled');
    }

    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      
      // Configurar user agent realista
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Rate limiting
      await this.rateLimiter.acquire();
      
      await page.goto(this.PORTAL_URLS.fega, { waitUntil: 'networkidle0' });
      
      // Buscar por referencia catastral
      await page.type('#ref-catastral', referencia);
      await page.click('#buscar-btn');
      
      // Esperar resultados
      await page.waitForSelector('.parcela-info', { timeout: 10000 });
      
      // Extraer datos
      const parcelaData = await page.evaluate(() => {
        const superficie = document.querySelector('.superficie')?.textContent;
        const cultivo = document.querySelector('.cultivo')?.textContent;
        const coordenadas = document.querySelector('.coordenadas')?.textContent;
        
        return { superficie, cultivo, coordenadas };
      });

      return this.transformScrapedData(parcelaData);
      
    } finally {
      await browser.close();
    }
  }

  private shouldUseScraping(): boolean {
    // Solo si está habilitado en config y hay rate limiting
    return process.env.ENABLE_SIGPAC_SCRAPING === 'true' && 
           this.rateLimiter.remainingTokens() > 0;
  }
}
```

#### 3. Sistema de Cache y Fallback
```typescript
// services/sigpac/sigpacService.ts
export class SIGPACService {
  constructor(
    private wmsClient: SIGPACWMSClient,
    private webScraper: SIGPACWebScraper,
    private cache: RedisCache,
    private db: Database
  ) {}

  async getParcelaByReferencia(referencia: string): Promise<SIGPACParcela> {
    // 1. Verificar cache
    const cached = await this.cache.get(`sigpac:${referencia}`);
    if (cached) {
      this.logger.info('SIGPAC data served from cache', { referencia });
      return cached;
    }

    // 2. Intentar WMS (método preferido)
    try {
      const wmsResult = await this.wmsClient.getParcelaGeometry(referencia);
      if (wmsResult) {
        await this.cacheResult(referencia, wmsResult);
        return wmsResult;
      }
    } catch (error) {
      this.logger.warn('WMS query failed, trying alternative methods', { referencia, error });
    }

    // 3. Intentar scraping (si está habilitado)
    if (process.env.ENABLE_SIGPAC_SCRAPING === 'true') {
      try {
        const scrapedResult = await this.webScraper.scrapeParcelaData(referencia);
        if (scrapedResult) {
          await this.cacheResult(referencia, scrapedResult);
          return scrapedResult;
        }
      } catch (error) {
        this.logger.warn('Scraping failed', { referencia, error });
      }
    }

    // 4. Buscar en base de datos local (datasets previos)
    const localResult = await this.db.sigpacParcelas.findByReferencia(referencia);
    if (localResult) {
      this.logger.info('SIGPAC data served from local DB', { referencia });
      return localResult;
    }

    // 5. Último recurso: permitir entrada manual
    throw new SIGPACNotFoundError(referencia);
  }

  private async cacheResult(referencia: string, data: SIGPACParcela): Promise<void> {
    // Cache por 30 días (datos catastrales no cambian frecuentemente)
    await this.cache.setex(`sigpac:${referencia}`, 30 * 24 * 3600, data);
    
    // También guardar en DB local para futuras consultas
    await this.db.sigpacParcelas.upsert({
      referencia,
      geometria: data.geometria,
      superficie: data.superficie,
      cultivo: data.cultivo,
      lastUpdated: new Date()
    });
  }
}
```

### Rate Limiting y Uso Ético
```typescript
// utils/rateLimiter.ts
export class SIGPACRateLimiter {
  private tokens: number = 100; // 100 requests per hour
  private refillRate: number = 100 / 3600; // tokens per second
  private lastRefill: number = Date.now();

  async acquire(): Promise<void> {
    this.refill();
    
    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.refillRate * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }

    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(100, this.tokens + timePassed * this.refillRate);
    this.lastRefill = now;
  }
}
```

## 2. Integración con Servicios OCR

### Google Vision API (Primaria)

```typescript
// services/ocr/googleVisionOCR.ts
import { ImageAnnotatorClient } from '@google-cloud/vision';

export class GoogleVisionOCRService {
  private client: ImageAnnotatorClient;

  constructor() {
    this.client = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });
  }

  async extractProductInfo(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      const [result] = await this.client.textDetection({
        image: { content: imageBuffer }
      });

      const detections = result.textAnnotations || [];
      if (detections.length === 0) {
        return { success: false, error: 'NO_TEXT_DETECTED' };
      }

      const fullText = detections[0].description || '';
      
      // Extraer información específica de productos agrícolas
      const productInfo = this.parseAgriculturalProduct(fullText);
      
      return {
        success: true,
        confidence: this.calculateConfidence(detections),
        rawText: fullText,
        productInfo,
        boundingBoxes: detections.slice(1).map(d => d.boundingPoly)
      };

    } catch (error) {
      this.logger.error('Google Vision API error', error);
      throw new OCRError('VISION_API_ERROR', error.message);
    }
  }

  private parseAgriculturalProduct(text: string): ProductInfo {
    const productInfo: ProductInfo = {};

    // Patterns para productos agrícolas españoles
    const patterns = {
      // Herbicidas
      glifosato: /glifosato\s*(\d+)%/i,
      mcpa: /mcpa\s*(\d+)%/i,
      
      // Fungicidas
      azufre: /azufre\s*(\d+)%/i,
      cobre: /cobre\s*(\d+)%/i,
      
      // Fertilizantes
      nitrogeno: /n[itrógeno]*\s*(\d+)%/i,
      fosforo: /p[2o5]*\s*(\d+)%/i,
      potasio: /k[2o]*\s*(\d+)%/i,
      
      // Número de registro
      registro: /n[úº]?\s*reg[istro]*[\s.:]*(\d+)/i,
      
      // Dosis
      dosis: /dosis[\s:]*(\d+(?:\.\d+)?)\s*(l|kg|ml|g)\/ha/i,
      
      // Fabricante
      fabricante: /fabricado\s+por[\s:]*([^\n]+)/i
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match) {
        productInfo[key] = match[1]?.trim();
      }
    });

    // Detectar tipo de producto
    if (text.toLowerCase().includes('herbicida')) {
      productInfo.tipo = 'herbicida';
    } else if (text.toLowerCase().includes('fungicida')) {
      productInfo.tipo = 'fungicida';
    } else if (text.toLowerCase().includes('insecticida')) {
      productInfo.tipo = 'insecticida';
    } else if (text.toLowerCase().includes('fertilizante') || text.toLowerCase().includes('abono')) {
      productInfo.tipo = 'fertilizante';
    }

    return productInfo;
  }

  private calculateConfidence(detections: any[]): number {
    if (detections.length === 0) return 0;
    
    // Calcular confianza basada en calidad del texto detectado
    const avgConfidence = detections
      .slice(1) // Skip full text detection
      .reduce((sum, detection) => sum + (detection.confidence || 0), 0) / (detections.length - 1);
    
    return Math.round(avgConfidence * 100) / 100;
  }
}
```

### Azure Cognitive Services (Fallback)

```typescript
// services/ocr/azureOCR.ts
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';

export class AzureOCRService {
  private client: ComputerVisionClient;

  constructor() {
    this.client = new ComputerVisionClient(
      new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_CV_KEY } }),
      process.env.AZURE_CV_ENDPOINT
    );
  }

  async extractText(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      // Enviar imagen para análisis
      const readResult = await this.client.readInStream(imageBuffer);
      const operationId = readResult.operationLocation.split('/').pop();

      // Polling para obtener resultados
      let result;
      do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = await this.client.getReadResult(operationId);
      } while (result.status === 'notStarted' || result.status === 'running');

      if (result.status !== 'succeeded') {
        throw new Error(`OCR failed with status: ${result.status}`);
      }

      // Procesar resultados
      const extractedText = result.analyzeResult.readResults
        .map(page => page.lines.map(line => line.text).join('\n'))
        .join('\n');

      return {
        success: true,
        confidence: this.calculateAzureConfidence(result.analyzeResult.readResults),
        rawText: extractedText,
        productInfo: this.parseAgriculturalProduct(extractedText)
      };

    } catch (error) {
      this.logger.error('Azure OCR error', error);
      throw new OCRError('AZURE_OCR_ERROR', error.message);
    }
  }
}
```

### Servicio OCR Unificado con Fallback

```typescript
// services/ocr/ocrService.ts
export class OCRService {
  constructor(
    private googleVision: GoogleVisionOCRService,
    private azureOCR: AzureOCRService,
    private cache: RedisCache
  ) {}

  async processProductImage(imageBuffer: Buffer, options: OCROptions = {}): Promise<OCRResult> {
    // Generar hash de imagen para cache
    const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    const cacheKey = `ocr:${imageHash}`;

    // Verificar cache
    const cached = await this.cache.get(cacheKey);
    if (cached && !options.forceRefresh) {
      return cached;
    }

    // Optimizar imagen antes del OCR
    const optimizedImage = await this.optimizeImage(imageBuffer);

    let result: OCRResult;

    try {
      // Intentar Google Vision primero (mejor para español)
      result = await this.googleVision.extractProductInfo(optimizedImage);
      
      if (result.confidence < 0.6) {
        // Si la confianza es baja, intentar Azure como backup
        this.logger.info('Low confidence from Google Vision, trying Azure', { 
          confidence: result.confidence 
        });
        
        const azureResult = await this.azureOCR.extractText(optimizedImage);
        if (azureResult.confidence > result.confidence) {
          result = azureResult;
        }
      }

    } catch (error) {
      this.logger.warn('Google Vision failed, falling back to Azure', error);
      result = await this.azureOCR.extractText(optimizedImage);
    }

    // Validar y enriquecer resultado
    result = await this.enrichProductInfo(result);

    // Cache por 24 horas (las etiquetas no cambian)
    await this.cache.setex(cacheKey, 24 * 3600, result);

    return result;
  }

  private async optimizeImage(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .normalize() // Mejorar contraste
      .sharpen() // Mejorar nitidez del texto
      .png({ quality: 90 })
      .toBuffer();
  }

  private async enrichProductInfo(result: OCRResult): Promise<OCRResult> {
    if (!result.success || !result.productInfo) {
      return result;
    }

    // Buscar en base de datos de productos conocidos
    const knownProduct = await this.db.productos.findByNumeroRegistro(
      result.productInfo.registro
    );

    if (knownProduct) {
      result.productInfo = {
        ...result.productInfo,
        nombreComercial: knownProduct.nombreComercial,
        fabricante: knownProduct.fabricante,
        tipoVerificado: knownProduct.tipo,
        dosisRecomendada: knownProduct.dosisRecomendada
      };
    }

    return result;
  }
}
```

## 3. Integración con APIs Meteorológicas

### AEMET (Agencia Estatal de Meteorología)

```typescript
// services/weather/aemetService.ts
export class AEMETWeatherService {
  private readonly API_BASE = 'https://opendata.aemet.es/opendata/api';
  private readonly API_KEY = process.env.AEMET_API_KEY;

  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    try {
      // Obtener estación meteorológica más cercana
      const station = await this.findNearestStation(lat, lng);
      
      // Obtener datos actuales
      const weatherData = await this.getStationData(station.indicativo);
      
      return {
        temperatura: weatherData.ta,
        humedad: weatherData.hr,
        precipitacion: weatherData.prec,
        viento: {
          velocidad: weatherData.vv,
          direccion: weatherData.dv
        },
        presion: weatherData.pres,
        timestamp: new Date(weatherData.fhora),
        estacion: station.nombre
      };

    } catch (error) {
      this.logger.error('Error fetching AEMET data', error);
      throw new WeatherError('AEMET_API_ERROR', error.message);
    }
  }

  async getWeatherForecast(lat: number, lng: number, days: number = 7): Promise<WeatherForecast[]> {
    const municipio = await this.findNearestMunicipality(lat, lng);
    
    const response = await fetch(
      `${this.API_BASE}/prediccion/especifica/municipio/diaria/${municipio.id}`,
      {
        headers: { 'api_key': this.API_KEY }
      }
    );

    if (!response.ok) {
      throw new Error(`AEMET API error: ${response.status}`);
    }

    const data = await response.json();
    const dataUrl = data.datos;

    // AEMET devuelve URL a los datos reales
    const forecastResponse = await fetch(dataUrl);
    const forecastData = await forecastResponse.json();

    return this.parseForecastData(forecastData[0], days);
  }

  private async findNearestStation(lat: number, lng: number): Promise<WeatherStation> {
    // Cache de estaciones (se actualiza diariamente)
    let stations = await this.cache.get('aemet:stations');
    
    if (!stations) {
      stations = await this.fetchAllStations();
      await this.cache.setex('aemet:stations', 24 * 3600, stations);
    }

    // Encontrar estación más cercana usando distancia haversine
    let nearestStation = stations[0];
    let minDistance = this.calculateDistance(lat, lng, nearestStation.latitud, nearestStation.longitud);

    for (const station of stations.slice(1)) {
      const distance = this.calculateDistance(lat, lng, station.latitud, station.longitud);
      if (distance < minDistance) {
        minDistance = distance;
        nearestStation = station;
      }
    }

    return nearestStation;
  }
}
```

### OpenWeatherMap (Fallback Internacional)

```typescript
// services/weather/openWeatherService.ts
export class OpenWeatherService {
  private readonly API_BASE = 'https://api.openweathermap.org/data/2.5';
  private readonly API_KEY = process.env.OPENWEATHER_API_KEY;

  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    const response = await fetch(
      `${this.API_BASE}/weather?lat=${lat}&lon=${lng}&appid=${this.API_KEY}&units=metric&lang=es`
    );

    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      temperatura: data.main.temp,
      humedad: data.main.humidity,
      precipitacion: data.rain?.['1h'] || 0,
      viento: {
        velocidad: data.wind.speed,
        direccion: data.wind.deg
      },
      presion: data.main.pressure,
      descripcion: data.weather[0].description,
      timestamp: new Date(data.dt * 1000)
    };
  }

  async getAgriculturalAlerts(lat: number, lng: number): Promise<AgricultureAlert[]> {
    // Obtener alertas específicas para agricultura
    const alerts = await this.getWeatherAlerts(lat, lng);
    
    return alerts
      .filter(alert => this.isAgriculturallyRelevant(alert))
      .map(alert => ({
        tipo: this.categorizeAlert(alert),
        severidad: alert.tags.includes('Extreme') ? 'alta' : 'media',
        descripcion: alert.description,
        inicio: new Date(alert.start * 1000),
        fin: new Date(alert.end * 1000),
        recomendaciones: this.getAgriculturalRecommendations(alert)
      }));
  }

  private isAgriculturallyRelevant(alert: any): boolean {
    const relevantEvents = [
      'frost', 'freeze', 'heat', 'wind', 'thunderstorm', 
      'hail', 'flood', 'drought'
    ];
    
    return relevantEvents.some(event => 
      alert.event.toLowerCase().includes(event)
    );
  }
}
```

## 4. Integración con APIs de Precios Agrícolas

### Lonja Agraria Nacional

```typescript
// services/pricing/lonjaService.ts
export class LonjaAgrariaService {
  private readonly LONJA_ENDPOINTS = {
    cereales: 'https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/economia/precios-percibidos-pagados-agricultores/',
    oleaginosas: 'https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/economia/precios-percibidos-pagados-agricultores/',
  };

  async getCurrentPrices(cultivo: string, region?: string): Promise<PreciosCultivo> {
    try {
      // Los datos oficiales suelen estar en formato PDF/Excel
      // Necesitamos parsear desde fuentes estructuradas
      
      const prices = await this.fetchPricesFromStructuredSource(cultivo, region);
      
      return {
        cultivo,
        region: region || 'nacional',
        precio_medio: prices.precio_medio,
        precio_minimo: prices.precio_minimo,
        precio_maximo: prices.precio_maximo,
        unidad: prices.unidad,
        fecha_actualizacion: prices.fecha,
        fuente: 'Lonja Agraria Nacional'
      };

    } catch (error) {
      this.logger.warn('Error fetching official prices, using alternative sources', error);
      return await this.getAlternativePrices(cultivo, region);
    }
  }

  private async fetchPricesFromStructuredSource(cultivo: string, region?: string): Promise<any> {
    // Implementación específica según disponibilidad de APIs
    // Muchas veces requiere scraping de portales oficiales
    
    const scrapedData = await this.scrapeOfficialPrices(cultivo);
    return this.parsePriceData(scrapedData, cultivo, region);
  }
}
```

### API de Precios Alternativos

```typescript
// services/pricing/marketDataService.ts
export class MarketDataService {
  async getCommodityPrices(productos: string[]): Promise<Map<string, PrecioMercado>> {
    const prices = new Map();

    // Fuentes múltiples para mayor fiabilidad
    const sources = [
      this.fetchFromCME(productos), // Chicago Mercantile Exchange
      this.fetchFromEuronext(productos), // Euronext (Europa)
      this.fetchFromMATIF(productos) // MATIF (París)
    ];

    const results = await Promise.allSettled(sources);
    
    // Combinar resultados y calcular precios promedio
    for (const producto of productos) {
      const productPrices = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value.get(producto))
        .filter(price => price !== undefined);

      if (productPrices.length > 0) {
        prices.set(producto, this.calculateAveragePrice(productPrices));
      }
    }

    return prices;
  }

  private async fetchFromCME(productos: string[]): Promise<Map<string, PrecioMercado>> {
    // Implementación específica para CME API
    // https://www.cmegroup.com/market-data.html
  }
}
```

## 5. Gestión Unificada de Integraciones

### Servicio de Integración Principal

```typescript
// services/integrations/integrationService.ts
export class IntegrationService {
  constructor(
    private sigpac: SIGPACService,
    private ocr: OCRService,
    private weather: WeatherService,
    private pricing: PricingService,
    private cache: RedisCache,
    private monitoring: MonitoringService
  ) {}

  async processNewActividad(actividad: ActividadInput): Promise<ActividadEnrichada> {
    const enrichedData: Partial<ActividadEnrichada> = { ...actividad };

    // Enriquecer con datos paralelos cuando sea posible
    const enrichmentTasks = [];

    // 1. Datos meteorológicos del momento
    if (actividad.coordenadas) {
      enrichmentTasks.push(
        this.weather.getCurrentWeather(
          actividad.coordenadas.lat, 
          actividad.coordenadas.lng
        ).then(weather => {
          enrichedData.condiciones_meteorologicas = weather;
        }).catch(error => {
          this.logger.warn('Failed to fetch weather data', error);
        })
      );
    }

    // 2. OCR de productos si hay fotos
    if (actividad.fotos && actividad.fotos.length > 0) {
      enrichmentTasks.push(
        this.processProductPhotos(actividad.fotos).then(productInfo => {
          enrichedData.productos_detectados = productInfo;
        }).catch(error => {
          this.logger.warn('Failed to process product photos', error);
        })
      );
    }

    // 3. Precios actuales del cultivo
    if (actividad.tipo === 'cosecha' && actividad.cultivo) {
      enrichmentTasks.push(
        this.pricing.getCurrentPrices(actividad.cultivo).then(prices => {
          enrichedData.precios_mercado = prices;
        }).catch(error => {
          this.logger.warn('Failed to fetch market prices', error);
        })
      );
    }

    // Ejecutar todas las tareas en paralelo con timeout
    await Promise.allSettled(enrichmentTasks);

    // Validar datos enriquecidos
    enrichedData.validaciones = await this.validateEnrichedData(enrichedData);

    return enrichedData as ActividadEnrichada;
  }

  private async processProductPhotos(fotos: Foto[]): Promise<ProductoDetectado[]> {
    const productos: ProductoDetectado[] = [];

    for (const foto of fotos) {
      try {
        const imageBuffer = await this.downloadImage(foto.url);
        const ocrResult = await this.ocr.processProductImage(imageBuffer);
        
        if (ocrResult.success && ocrResult.productInfo) {
          productos.push({
            foto_id: foto.id,
            confidence: ocrResult.confidence,
            producto_info: ocrResult.productInfo,
            texto_extraido: ocrResult.rawText
          });
        }
      } catch (error) {
        this.logger.error('Error processing product photo', { fotoId: foto.id, error });
      }
    }

    return productos;
  }
}
```

### Monitoreo y Health Checks

```typescript
// services/integrations/healthCheck.ts
export class IntegrationHealthCheck {
  async checkAllServices(): Promise<ServiceHealthReport> {
    const checks = await Promise.allSettled([
      this.checkSIGPAC(),
      this.checkOCR(),
      this.checkWeatherAPI(),
      this.checkPricingAPI()
    ]);

    return {
      timestamp: new Date(),
      services: {
        sigpac: this.extractCheckResult(checks[0]),
        ocr: this.extractCheckResult(checks[1]),
        weather: this.extractCheckResult(checks[2]),
        pricing: this.extractCheckResult(checks[3])
      },
      overall_status: checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'degraded'
    };
  }

  private async checkSIGPAC(): Promise<ServiceStatus> {
    try {
      // Test con referencia conocida
      const testRef = '28:079:0001:00001:0001:WI';
      const startTime = Date.now();
      
      await this.sigpac.getParcelaByReferencia(testRef);
      
      return {
        status: 'healthy',
        response_time: Date.now() - startTime,
        last_check: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        last_check: new Date()
      };
    }
  }

  private async checkOCR(): Promise<ServiceStatus> {
    try {
      // Test con imagen de prueba pequeña
      const testImage = await this.generateTestImage();
      const startTime = Date.now();
      
      await this.ocr.processProductImage(testImage);
      
      return {
        status: 'healthy',
        response_time: Date.now() - startTime,
        last_check: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        last_check: new Date()
      };
    }
  }
}
```

### Rate Limiting y Circuit Breaker

```typescript
// utils/circuitBreaker.ts
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly retryDelay: number = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.retryDelay) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
        )
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
```

## 6. Configuración y Variables de Entorno

```typescript
// config/integrations.ts
export const integrationConfig = {
  sigpac: {
    enableScraping: process.env.ENABLE_SIGPAC_SCRAPING === 'true',
    maxRequestsPerHour: parseInt(process.env.SIGPAC_RATE_LIMIT || '100'),
    cacheTimeout: 30 * 24 * 3600, // 30 días
    endpoints: {
      wms_nacional: process.env.SIGPAC_WMS_NACIONAL || 'https://wms.mapama.gob.es/wms/wms.aspx',
      // ... otros endpoints
    }
  },
  
  ocr: {
    google: {
      enabled: !!process.env.GOOGLE_CLOUD_KEY_FILE,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFile: process.env.GOOGLE_CLOUD_KEY_FILE
    },
    azure: {
      enabled: !!process.env.AZURE_CV_KEY,
      endpoint: process.env.AZURE_CV_ENDPOINT,
      key: process.env.AZURE_CV_KEY
    },
    fallbackEnabled: true,
    maxImageSize: 5 * 1024 * 1024, // 5MB
    supportedFormats: ['jpeg', 'png', 'webp']
  },
  
  weather: {
    aemet: {
      enabled: !!process.env.AEMET_API_KEY,
      apiKey: process.env.AEMET_API_KEY,
      endpoint: 'https://opendata.aemet.es/opendata/api'
    },
    openweather: {
      enabled: !!process.env.OPENWEATHER_API_KEY,
      apiKey: process.env.OPENWEATHER_API_KEY,
      endpoint: 'https://api.openweathermap.org/data/2.5'
    },
    cacheTimeout: 3600, // 1 hora
    alertsEnabled: true
  },
  
  pricing: {
    enableScraping: process.env.ENABLE_PRICING_SCRAPING === 'true',
    updateInterval: 24 * 3600, // Actualizar diariamente
    sources: ['lonja_nacional', 'cme', 'euronext'],
    fallbackEnabled: true
  }
};
```

## Resumen de Integraciones

| Servicio | Estado | Criticidad | Fallback | SLA Target |
|----------|--------|------------|----------|------------|
| **SIGPAC** | Implementado | Alta | Base datos local | 95% |
| **Google Vision OCR** | Implementado | Media | Azure OCR | 99% |
| **AEMET Weather** | Implementado | Baja | OpenWeather | 90% |
| **Precios Mercado** | Planificado | Baja | Cache histórico | 85% |

### Costos Estimados Mensuales
- Google Vision API: ~50€ (5000 imágenes)
- Azure OCR (fallback): ~20€ 
- OpenWeather API: ~15€
- AEMET: Gratuito
- **Total**: ~85€/mes (para 1000 usuarios activos)

Este sistema de integraciones proporciona robustez y redundancia mientras mantiene costos controlados y cumple con las mejores prácticas de desarrollo.