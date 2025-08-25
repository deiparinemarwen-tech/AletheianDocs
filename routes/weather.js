const express = require('express');
const axios = require('axios');
const router = express.Router();

const OPENWEATHER_API_KEY = process.env.NEXT_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Philippine major cities with coordinates
const PHILIPPINE_CITIES = {
  'manila': { lat: 14.5995, lon: 120.9842, name: 'Manila' },
  'cebu': { lat: 10.3157, lon: 123.8854, name: 'Cebu City' },
  'davao': { lat: 7.1907, lon: 125.4553, name: 'Davao City' },
  'quezon': { lat: 14.6760, lon: 121.0437, name: 'Quezon City' },
  'caloocan': { lat: 14.6479, lon: 120.9635, name: 'Caloocan' },
  'zamboanga': { lat: 6.9214, lon: 122.0790, name: 'Zamboanga City' },
  'taguig': { lat: 14.5176, lon: 121.0509, name: 'Taguig' },
  'antipolo': { lat: 14.5945, lon: 121.1779, name: 'Antipolo' },
  'pasig': { lat: 14.5764, lon: 121.0851, name: 'Pasig' },
  'cagayan': { lat: 8.4542, lon: 124.6319, name: 'Cagayan de Oro' },
  'paranaque': { lat: 14.4793, lon: 121.0198, name: 'Parañaque' },
  'valenzuela': { lat: 14.7000, lon: 120.9830, name: 'Valenzuela' },
  'bacoor': { lat: 14.4592, lon: 120.9469, name: 'Bacoor' },
  'iloilo': { lat: 10.7202, lon: 122.5621, name: 'Iloilo City' },
  'muntinlupa': { lat: 14.3832, lon: 121.0409, name: 'Muntinlupa' },
  'las_pinas': { lat: 14.4378, lon: 120.9933, name: 'Las Piñas' },
  'makati': { lat: 14.5547, lon: 121.0244, name: 'Makati' },
  'bacolod': { lat: 10.6740, lon: 122.9500, name: 'Bacolod' },
  'marikina': { lat: 14.6507, lon: 121.1029, name: 'Marikina' },
  'dasmariñas': { lat: 14.3294, lon: 120.9367, name: 'Dasmariñas' }
};

// Get weather for a specific city
router.get('/city/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    const cityKey = cityName.toLowerCase().replace(/\s+/g, '_');
    
    if (!OPENWEATHER_API_KEY) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    const city = PHILIPPINE_CITIES[cityKey];
    if (!city) {
      return res.status(404).json({ error: 'City not found in Philippine cities list' });
    }

    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat: city.lat,
        lon: city.lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });

    const weatherData = response.data;
    
    res.json({
      city: city.name,
      coordinates: { lat: city.lat, lon: city.lon },
      weather: {
        temperature: Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        description: weatherData.weather[0].description,
        main: weatherData.weather[0].main,
        icon: weatherData.weather[0].icon,
        windSpeed: weatherData.wind.speed,
        windDirection: weatherData.wind.deg,
        visibility: weatherData.visibility / 1000, // Convert to km
        cloudiness: weatherData.clouds.all
      },
      timestamp: new Date(weatherData.dt * 1000).toISOString(),
      sunrise: new Date(weatherData.sys.sunrise * 1000).toISOString(),
      sunset: new Date(weatherData.sys.sunset * 1000).toISOString()
    });
  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid weather API key' });
    } else if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Weather API rate limit exceeded' });
    }
    
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Get weather by coordinates
router.get('/coordinates/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    if (!OPENWEATHER_API_KEY) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Verify coordinates are within Philippine bounds (approximate)
    if (latitude < 4.5 || latitude > 21.0 || longitude < 116.0 || longitude > 127.0) {
      return res.status(400).json({ error: 'Coordinates outside Philippines' });
    }

    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });

    const weatherData = response.data;
    
    res.json({
      location: weatherData.name || 'Unknown Location',
      coordinates: { lat: latitude, lon: longitude },
      weather: {
        temperature: Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        description: weatherData.weather[0].description,
        main: weatherData.weather[0].main,
        icon: weatherData.weather[0].icon,
        windSpeed: weatherData.wind.speed,
        windDirection: weatherData.wind.deg,
        visibility: weatherData.visibility / 1000,
        cloudiness: weatherData.clouds.all
      },
      timestamp: new Date(weatherData.dt * 1000).toISOString(),
      sunrise: new Date(weatherData.sys.sunrise * 1000).toISOString(),
      sunset: new Date(weatherData.sys.sunset * 1000).toISOString()
    });
  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Get available Philippine cities
router.get('/cities', (req, res) => {
  const cities = Object.values(PHILIPPINE_CITIES).map(city => ({
    name: city.name,
    coordinates: { lat: city.lat, lon: city.lon }
  }));
  
  res.json({ cities });
});

// Get weather forecast for a city (5-day forecast)
router.get('/forecast/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    const cityKey = cityName.toLowerCase().replace(/\s+/g, '_');
    
    if (!OPENWEATHER_API_KEY) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    const city = PHILIPPINE_CITIES[cityKey];
    if (!city) {
      return res.status(404).json({ error: 'City not found in Philippine cities list' });
    }

    const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        lat: city.lat,
        lon: city.lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });

    const forecastData = response.data;
    
    // Process forecast data to daily summaries
    const dailyForecasts = {};
    
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date,
          temperatures: [],
          descriptions: [],
          humidity: [],
          weather: item.weather[0]
        };
      }
      
      dailyForecasts[date].temperatures.push(item.main.temp);
      dailyForecasts[date].descriptions.push(item.weather[0].description);
      dailyForecasts[date].humidity.push(item.main.humidity);
    });

    const processedForecast = Object.values(dailyForecasts).map(day => ({
      date: day.date,
      temperature: {
        min: Math.round(Math.min(...day.temperatures)),
        max: Math.round(Math.max(...day.temperatures)),
        avg: Math.round(day.temperatures.reduce((a, b) => a + b) / day.temperatures.length)
      },
      humidity: Math.round(day.humidity.reduce((a, b) => a + b) / day.humidity.length),
      description: day.descriptions[0], // Use first description of the day
      main: day.weather.main,
      icon: day.weather.icon
    }));

    res.json({
      city: city.name,
      forecast: processedForecast.slice(0, 5) // Limit to 5 days
    });
  } catch (error) {
    console.error('Forecast API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch weather forecast' });
  }
});

module.exports = router;