# Hướng dẫn tích hợp AI Price Prediction với Backend C#

## Tổng quan

Dịch vụ AI Price Prediction được xây dựng bằng Python Flask và có thể tích hợp với backend C# (.NET) thông qua HTTP API calls.

## Kiến trúc hệ thống

```
Frontend (React) → Backend C# (.NET) → Python AI Service → AI Model
```

## 1. Cài đặt Python AI Service

### Cách 1: Chạy trực tiếp
```bash
cd ai_price_service
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py
```

### Cách 2: Sử dụng Docker
```bash
cd ai_price_service
docker-compose up -d
```

## 2. Tích hợp với Backend C#

### 2.1. Tạo Model trong C#

```csharp
// Models/VehicleData.cs
public class VehicleData
{
    public string Brand { get; set; }
    public string Model { get; set; }
    public int Year { get; set; }
    public int Mileage { get; set; }
    public string Condition { get; set; }
    public string FuelType { get; set; }
    public string Transmission { get; set; }
    public string Location { get; set; }
}

// Models/AiPredictionResponse.cs
public class AiPredictionResponse
{
    public bool Success { get; set; }
    public AiPrediction Prediction { get; set; }
    public string Error { get; set; }
    public DateTime Timestamp { get; set; }
}

public class AiPrediction
{
    public int PredictedPrice { get; set; }
    public double Confidence { get; set; }
    public int? RfPrediction { get; set; }
    public int? GbPrediction { get; set; }
    public int? EnsemblePrediction { get; set; }
    public PriceFactors Factors { get; set; }
}

public class PriceFactors
{
    public int Age { get; set; }
    public int Mileage { get; set; }
    public string Condition { get; set; }
    public string Location { get; set; }
    public string MarketTrend { get; set; }
    public string ConfidenceLevel { get; set; }
}
```

### 2.2. Tạo Service trong C#

```csharp
// Services/IAiPriceService.cs
public interface IAiPriceService
{
    Task<AiPredictionResponse> PredictPriceAsync(VehicleData vehicleData);
    Task<bool> IsServiceHealthyAsync();
}

// Services/AiPriceService.cs
public class AiPriceService : IAiPriceService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiPriceService> _logger;

    public AiPriceService(HttpClient httpClient, IConfiguration configuration, ILogger<AiPriceService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AiPredictionResponse> PredictPriceAsync(VehicleData vehicleData)
    {
        try
        {
            var aiServiceUrl = _configuration["AiService:BaseUrl"] ?? "http://localhost:5000";
            var json = JsonSerializer.Serialize(vehicleData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{aiServiceUrl}/predict-price", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var result = JsonSerializer.Deserialize<AiPredictionResponse>(responseContent);
                return result;
            }
            else
            {
                _logger.LogError("AI service returned error: {StatusCode} - {Content}", 
                    response.StatusCode, responseContent);
                return new AiPredictionResponse
                {
                    Success = false,
                    Error = $"AI service error: {response.StatusCode}",
                    Timestamp = DateTime.UtcNow
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AI price prediction service");
            return new AiPredictionResponse
            {
                Success = false,
                Error = ex.Message,
                Timestamp = DateTime.UtcNow
            };
        }
    }

    public async Task<bool> IsServiceHealthyAsync()
    {
        try
        {
            var aiServiceUrl = _configuration["AiService:BaseUrl"] ?? "http://localhost:5000";
            var response = await _httpClient.GetAsync($"{aiServiceUrl}/health");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }
}
```

### 2.3. Đăng ký Service trong Program.cs

```csharp
// Program.cs
builder.Services.AddHttpClient<IAiPriceService, AiPriceService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

// appsettings.json
{
  "AiService": {
    "BaseUrl": "http://localhost:5000",
    "Timeout": 30
  }
}
```

### 2.4. Tạo Controller

```csharp
// Controllers/AiController.cs
[ApiController]
[Route("api/[controller]")]
public class AiController : ControllerBase
{
    private readonly IAiPriceService _aiPriceService;
    private readonly ILogger<AiController> _logger;

    public AiController(IAiPriceService aiPriceService, ILogger<AiController> logger)
    {
        _aiPriceService = aiPriceService;
        _logger = logger;
    }

    [HttpPost("predict-price")]
    public async Task<IActionResult> PredictPrice([FromBody] VehicleData vehicleData)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _aiPriceService.PredictPriceAsync(vehicleData);
            
            if (result.Success)
            {
                return Ok(result);
            }
            else
            {
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in AI price prediction");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("health")]
    public async Task<IActionResult> HealthCheck()
    {
        try
        {
            var isHealthy = await _aiPriceService.IsServiceHealthyAsync();
            return Ok(new { healthy = isHealthy, timestamp = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking AI service health");
            return StatusCode(500, "Internal server error");
        }
    }
}
```

### 2.5. Tích hợp vào Product Controller

```csharp
// Controllers/ProductController.cs
[HttpPost]
public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
{
    try
    {
        // ... existing code ...

        // AI price suggestion
        if (request.RequestAiPriceSuggestion)
        {
            var vehicleData = new VehicleData
            {
                Brand = request.Brand,
                Model = request.Model,
                Year = request.Year,
                Mileage = request.Mileage,
                Condition = request.Condition,
                FuelType = request.FuelType,
                Transmission = request.Transmission,
                Location = request.Location
            };

            var aiPrediction = await _aiPriceService.PredictPriceAsync(vehicleData);
            
            if (aiPrediction.Success)
            {
                // Add AI prediction to response
                var response = new
                {
                    Product = product,
                    AiPrediction = aiPrediction.Prediction
                };
                return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, response);
            }
        }

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating product");
        return StatusCode(500, "Internal server error");
    }
}
```

## 3. Cấu hình Frontend

### 3.1. Cập nhật API Base URL

```javascript
// src/lib/api.js
const AI_API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL || "http://localhost:5000";
```

### 3.2. Environment Variables

```bash
# .env
VITE_API_BASE_URL=http://localhost:5044
VITE_AI_API_BASE_URL=http://localhost:5000
```

## 4. Deployment

### 4.1. Docker Compose cho Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  ai-price-service:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./models:/app/models
    environment:
      - FLASK_ENV=production
    restart: unless-stopped
    networks:
      - app-network

  backend:
    # Your C# backend configuration
    networks:
      - app-network

  frontend:
    # Your React frontend configuration
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### 4.2. Kubernetes Deployment

```yaml
# k8s/ai-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-price-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-price-service
  template:
    metadata:
      labels:
        app: ai-price-service
    spec:
      containers:
      - name: ai-price-service
        image: ai-price-service:latest
        ports:
        - containerPort: 5000
        env:
        - name: FLASK_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: ai-price-service
spec:
  selector:
    app: ai-price-service
  ports:
  - port: 5000
    targetPort: 5000
  type: ClusterIP
```

## 5. Monitoring và Logging

### 5.1. Health Checks

```csharp
// Services/HealthCheckService.cs
public class AiServiceHealthCheck : IHealthCheck
{
    private readonly IAiPriceService _aiPriceService;

    public AiServiceHealthCheck(IAiPriceService aiPriceService)
    {
        _aiPriceService = aiPriceService;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var isHealthy = await _aiPriceService.IsServiceHealthyAsync();
            return isHealthy 
                ? HealthCheckResult.Healthy("AI service is healthy")
                : HealthCheckResult.Unhealthy("AI service is not responding");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("AI service error", ex);
        }
    }
}
```

### 5.2. Logging

```csharp
// Controllers/AiController.cs
[HttpPost("predict-price")]
public async Task<IActionResult> PredictPrice([FromBody] VehicleData vehicleData)
{
    _logger.LogInformation("AI price prediction requested for {Brand} {Model} {Year}", 
        vehicleData.Brand, vehicleData.Model, vehicleData.Year);
    
    var result = await _aiPriceService.PredictPriceAsync(vehicleData);
    
    if (result.Success)
    {
        _logger.LogInformation("AI prediction successful: {Price} VND with {Confidence}% confidence", 
            result.Prediction.PredictedPrice, result.Prediction.Confidence * 100);
    }
    else
    {
        _logger.LogWarning("AI prediction failed: {Error}", result.Error);
    }
    
    return Ok(result);
}
```

## 6. Testing

### 6.1. Unit Tests

```csharp
// Tests/AiPriceServiceTests.cs
[Test]
public async Task PredictPriceAsync_ValidData_ReturnsSuccess()
{
    // Arrange
    var vehicleData = new VehicleData
    {
        Brand = "VinFast",
        Model = "VF8",
        Year = 2023,
        Mileage = 5000,
        Condition = "excellent",
        FuelType = "electric",
        Transmission = "automatic",
        Location = "Hà Nội"
    };

    // Act
    var result = await _aiPriceService.PredictPriceAsync(vehicleData);

    // Assert
    Assert.IsTrue(result.Success);
    Assert.IsNotNull(result.Prediction);
    Assert.Greater(result.Prediction.PredictedPrice, 0);
}
```

### 6.2. Integration Tests

```csharp
// Tests/Integration/AiControllerIntegrationTests.cs
[Test]
public async Task PredictPrice_ValidRequest_ReturnsOk()
{
    // Arrange
    var request = new VehicleData
    {
        Brand = "VinFast",
        Model = "VF8",
        Year = 2023,
        Mileage = 5000,
        Condition = "excellent",
        FuelType = "electric",
        Transmission = "automatic",
        Location = "Hà Nội"
    };

    // Act
    var response = await _client.PostAsJsonAsync("/api/ai/predict-price", request);

    // Assert
    response.EnsureSuccessStatusCode();
    var result = await response.Content.ReadFromJsonAsync<AiPredictionResponse>();
    Assert.IsTrue(result.Success);
}
```

## 7. Troubleshooting

### 7.1. Common Issues

1. **AI Service không khả dụng**
   - Kiểm tra Python service có đang chạy không
   - Kiểm tra port 5000 có bị block không
   - Kiểm tra firewall settings

2. **Timeout errors**
   - Tăng timeout trong HttpClient configuration
   - Kiểm tra network latency
   - Optimize AI model performance

3. **CORS errors**
   - Cấu hình CORS trong Python service
   - Kiểm tra allowed origins

### 7.2. Debug Commands

```bash
# Kiểm tra AI service
curl http://localhost:5000/health

# Test prediction
curl -X POST http://localhost:5000/predict-price \
  -H "Content-Type: application/json" \
  -d '{"brand":"VinFast","model":"VF8","year":2023,"mileage":5000,"condition":"excellent","fuelType":"electric","transmission":"automatic","location":"Hà Nội"}'

# Kiểm tra logs
docker logs ai-price-service
```

## 8. Performance Optimization

### 8.1. Caching

```csharp
// Services/CachedAiPriceService.cs
public class CachedAiPriceService : IAiPriceService
{
    private readonly IAiPriceService _aiPriceService;
    private readonly IMemoryCache _cache;
    private readonly TimeSpan _cacheExpiry = TimeSpan.FromMinutes(30);

    public async Task<AiPredictionResponse> PredictPriceAsync(VehicleData vehicleData)
    {
        var cacheKey = GenerateCacheKey(vehicleData);
        
        if (_cache.TryGetValue(cacheKey, out AiPredictionResponse cachedResult))
        {
            return cachedResult;
        }

        var result = await _aiPriceService.PredictPriceAsync(vehicleData);
        
        if (result.Success)
        {
            _cache.Set(cacheKey, result, _cacheExpiry);
        }

        return result;
    }

    private string GenerateCacheKey(VehicleData vehicleData)
    {
        return $"{vehicleData.Brand}_{vehicleData.Model}_{vehicleData.Year}_{vehicleData.Mileage}_{vehicleData.Condition}_{vehicleData.Location}";
    }
}
```

### 8.2. Batch Processing

```csharp
[HttpPost("predict-prices-batch")]
public async Task<IActionResult> PredictPricesBatch([FromBody] List<VehicleData> vehicleDataList)
{
    var tasks = vehicleDataList.Select(data => _aiPriceService.PredictPriceAsync(data));
    var results = await Task.WhenAll(tasks);
    
    return Ok(results);
}
```

## 9. Security Considerations

### 9.1. API Authentication

```csharp
// Services/AiPriceService.cs
public async Task<AiPredictionResponse> PredictPriceAsync(VehicleData vehicleData)
{
    var request = new HttpRequestMessage(HttpMethod.Post, $"{_aiServiceUrl}/predict-price");
    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
    
    var json = JsonSerializer.Serialize(vehicleData);
    request.Content = new StringContent(json, Encoding.UTF8, "application/json");
    
    var response = await _httpClient.SendAsync(request);
    // ... rest of the implementation
}
```

### 9.2. Rate Limiting

```csharp
// Controllers/AiController.cs
[HttpPost("predict-price")]
[RateLimit(Name = "AiPrediction", Seconds = 60, Requests = 10)]
public async Task<IActionResult> PredictPrice([FromBody] VehicleData vehicleData)
{
    // ... implementation
}
```

## 10. Future Enhancements

1. **Real-time Market Data Integration**
2. **Machine Learning Model Retraining**
3. **A/B Testing for Different Models**
4. **Advanced Analytics Dashboard**
5. **Multi-language Support**
6. **Mobile API Optimization**
