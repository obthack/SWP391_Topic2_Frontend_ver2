# AI Price Prediction Service

Dịch vụ AI để đề xuất giá xe điện dựa trên các thông số kỹ thuật và tình trạng xe.

## Cài đặt

1. Tạo virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate  # Windows
```

2. Cài đặt dependencies:
```bash
pip install -r requirements.txt
```

## Chạy service

```bash
python app.py
```

Service sẽ chạy tại `http://localhost:5000`

## API Endpoints

### 1. Health Check
```
GET /health
```

### 2. Dự đoán giá
```
POST /predict-price
Content-Type: application/json

{
  "brand": "VinFast",
  "model": "VF8",
  "year": 2023,
  "mileage": 5000,
  "condition": "excellent",
  "fuelType": "electric",
  "transmission": "automatic"
}
```

Response:
```json
{
  "success": true,
  "prediction": {
    "predicted_price": 1200000000,
    "confidence": 0.85,
    "factors": {
      "age_factor": 1.0,
      "mileage_factor": 0.95,
      "base_prediction": 1263157894
    }
  },
  "timestamp": "2024-01-15T10:30:00"
}
```

### 3. Retrain Model
```
POST /retrain
Content-Type: application/json

{
  "training_data": [...]
}
```

## Tích hợp với Backend C#

Trong controller C#, thêm method để gọi Python service:

```csharp
[HttpPost("suggest-price")]
public async Task<IActionResult> SuggestPrice([FromBody] VehicleData data)
{
    try
    {
        var pythonServiceUrl = "http://localhost:5000/predict-price";
        
        using var client = new HttpClient();
        var json = JsonSerializer.Serialize(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await client.PostAsync(pythonServiceUrl, content);
        var result = await response.Content.ReadAsStringAsync();
        
        return Ok(JsonSerializer.Deserialize<object>(result));
    }
    catch (Exception ex)
    {
        return BadRequest($"Error calling AI service: {ex.Message}");
    }
}
```

## Model Training

Model hiện tại sử dụng Random Forest Regressor với dữ liệu mẫu. Để cải thiện độ chính xác:

1. Thu thập dữ liệu thực tế từ database
2. Thêm các features khác như location, market trends
3. Sử dụng deep learning models như Neural Networks
4. Implement online learning để cập nhật model liên tục

## Deployment

### Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

### Docker Compose
```yaml
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
```
