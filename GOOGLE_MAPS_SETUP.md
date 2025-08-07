# Leaflet with OpenStreetMap Integration

## Overview
This guide explains the Leaflet with OpenStreetMap integration for the Bike Rental System. The integration allows users to select pickup locations on a map when making a payment, without requiring any API keys.

## Advantages of Leaflet with OpenStreetMap

1. **No API Key Required**
   - OpenStreetMap is a free, open-source mapping platform
   - No billing or usage limits to worry about

2. **Privacy-Focused**
   - Less tracking compared to commercial map providers
   - Open-source community-maintained data

3. **Customizable**
   - Highly customizable map styles and features
   - Extensive plugin ecosystem

## Integration Details

The project uses:
- **Leaflet**: A leading open-source JavaScript library for mobile-friendly interactive maps
- **React-Leaflet**: React components for Leaflet maps
- **OpenStreetMap**: Free and open geographic data

## Testing the Integration

1. **Navigate to the Payment Page**
   - Start the application and navigate to the payment page
   - You should see an OpenStreetMap where you can select a pickup location

2. **Select a Location**
   - Click on the map to select a pickup location
   - The coordinates should appear below the map

3. **Complete the Payment**
   - Fill in the payment details and complete the transaction
   - The selected location should be sent to the backend with the payment confirmation

## Troubleshooting

- **Map Not Loading**: Check your internet connection and ensure the Leaflet CSS is properly loaded
- **Marker Icons Missing**: This is a common issue with Leaflet in React applications. The code includes a fix for this, but if markers are still missing, check the browser console for path errors
- **Console Errors**: Check the browser console for any error messages related to Leaflet or OpenStreetMap

## Customization Options

- **Different Map Styles**: You can use different tile providers by changing the TileLayer URL
- **Custom Markers**: You can customize the marker icons by providing your own images
- **Additional Features**: Leaflet has many plugins for features like routing, heatmaps, and more

## Additional Resources

- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [React-Leaflet Documentation](https://react-leaflet.js.org/)
- [OpenStreetMap Wiki](https://wiki.openstreetmap.org/)