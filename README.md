# IFAW Hwange-Matetsi-Zambezi Landscape Map

This repository contains an interactive web map that visualizes the elephant corridors and land use in the Greater Hwange Landscape. The map displays various geographic features including wildlife corridors, protected areas, rivers, roads, and administrative boundaries.

## Overview

The interactive map shows:

- Wildlife corridors with animated directional arrows
- Land use categories with different color coding
- Chiefs' locations with 15km radius buffers
- Road networks categorized by type
- Rivers and water sources
- Administrative boundaries (wards)
- IFAW operational areas

## Features

- Interactive layer toggle for all map features
- Popup information for all map elements
- Animated arrows showing direction of wildlife movement
- Visual distinction between different land types (National Parks, Safari Areas, Forest Land, etc.)
- Responsive design for desktop and mobile devices
- Full-screen mode
- Multiple basemap options (OpenStreetMap, Satellite, Topographic)

## Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/Malaz-nc/ifaw-hmz-landscape.git
   cd ifaw-hmz-landscape
   ```

2. Ensure your GeoJSON data files are placed in the `data/` directory with the following structure:
   - `bufferwards.geojson`
   - `category1_road.geojson`
   - `category2_road.geojson`
   - `category3_road.geojson`
   - `chiefs.geojson`
   - `Community_CA.geojson`
   - `corridors.geojson`
   - `HMZ_Boundary.geojson`
   - `Landscape_boundary.geojson`
   - `Landuse.geojson`
   - `Landuse2.geojson`
   - `Places_of_interest.geojson`
   - `rivers.geojson`
   - `wards.geojson`
   - `water_sources.geojson`

3. Create an `images` folder and add:
   - `ifaw-logo.png` - The IFAW logo
   - `north-arrow.png` - A north arrow graphic

4. Open `index.html` in a web browser to view the map locally, or deploy to a web server.

## Development

To make changes to the map:

1. Edit the `js/config.js` file to adjust map settings, colors, and layer properties
2. Modify `js/map.js` to change the map functionality
3. Update `css/style.css` to change the styling

## GeoJSON Data Format Requirements

Each GeoJSON file should follow standard GeoJSON format. For example:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Feature Name",
        "attribute1": "value1",
        "attribute2": "value2"
      },
      "geometry": {
        "type": "Point/LineString/Polygon",
        "coordinates": [...]
      }
    }
  ]
}
```

### Land Use Data

The land use GeoJSON files should include a `LANDTYPE` property with values such as:
- "Communal Land"
- "Target Forest Land"
- "Large Scale Farming"
- "National Park"
- "Safari Area"
- "Small Scale Farming"
- "Community CA"

## Deployment

To deploy to GitHub Pages:

1. Go to the repository settings on GitHub
2. Navigate to the "Pages" section
3. Select the main branch as the source
4. The site will be published at `https://malaz-nc.github.io/ifaw-hmz-landscape/`

## Technologies Used

- HTML5, CSS3, JavaScript
- [Leaflet](https://leafletjs.com/) - JavaScript library for interactive maps
- [Leaflet.PolylineDecorator](https://github.com/bbecquet/Leaflet.PolylineDecorator) - For animated arrows
- [Leaflet.fullscreen](https://github.com/Leaflet/Leaflet.fullscreen) - For fullscreen functionality
- [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) - For clustering markers