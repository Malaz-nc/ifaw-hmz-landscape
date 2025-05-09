# IFAW Hwange-Matetsi-Zambezi Landscape Map

This repository contains an interactive web map that visualizes the elephant corridors and land use in the Greater Hwange Landscape. The map displays wildlife corridors with animated directional arrows, land use types, administrative boundaries, and other important features of the landscape.

## Overview

The interactive map shows:

- Wildlife corridors with animated directional arrows showing elephant movement
- Land use categories with different color coding (National Parks, Safari Areas, Forest Land, etc.)
- Chiefs' locations with 15km radius buffers
- Road networks categorized by type
- Rivers and water sources
- Administrative boundaries (wards)
- IFAW operational areas

## Features

- Interactive layer toggle for all map features
- Popup information for all map elements
- Animated arrows showing direction of wildlife movement
- Side panel with feature information on click
- Visual distinction between different land types
- Responsive design for desktop and mobile devices
- Basic spatial analysis (area calculation, corridor length)

## Quick Start

1. Clone the repository:
   ```
   git clone https://github.com/Malaz-nc/ifaw-hmz-landscape.git
   cd ifaw-hmz-landscape
   ```

2. Place your GeoJSON data files in the `data/` directory:
   - Make sure all filenames match exactly with the ones listed below
   - Run the `setup.bat` script to automatically copy files from the current directory to the data folder

3. Open `index.html` in a web browser to view the map locally.

4. Deploy to GitHub Pages:
   ```
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```
   Then enable GitHub Pages in your repository settings.

## Data Files

This map requires the following GeoJSON files placed in the `data/` directory:

- `bufferwards.geojson` - IFAW operating wards
- `category1_road.geojson` - Primary roads
- `category2_road.geojson` - Secondary roads
- `category3_road.geojson` - Tertiary roads
- `chiefs.geojson` - Chief locations
- `Community_CA.geojson` - Community conservation areas
- `corridors.geojson` - Wildlife corridors
- `HMZ_Boundary.geojson` - HMZ boundary
- `Landscape_boundary.geojson` - Landscape boundary
- `Landuse.geojson` - Primary land use (takes precedence)
- `Landuse2.geojson` - Secondary land use (underneath)
- `Places_of_interest.geojson` - Points of interest
- `rivers.geojson` - Rivers
- `wards.geojson` - Administrative wards
- `water_sources.geojson` - Water sources

## GeoJSON Format Requirements

Each GeoJSON file should follow standard GeoJSON format. Specific notes:

### Land Use Files

The land use GeoJSON files (`Landuse.geojson` and `Landuse2.geojson`) should include a `LANDTYPE` property with values such as:
- "Communal Land"
- "Target Forest Land"
- "Large Scale Farming"
- "National Park"
- "Safari Area"
- "Small Scale Farming"
- "Community CA"

### Chiefs

The `chiefs.geojson` file should contain point features representing the locations of chiefs. The map will automatically create a 15km buffer around each point.

### Corridors

The `corridors.geojson` file should contain LineString features representing wildlife corridors. The map will automatically add animated arrows to show direction of movement.

## Customization

To customize the map:

1. Edit `js/config.js` to change colors, initial map center, and other settings
2. Modify `css/style.css` to change the styling
3. Update `js/map.js` to add or modify functionality

## Technologies Used

- HTML5, CSS3, JavaScript
- [Leaflet](https://leafletjs.com/) - JavaScript library for interactive maps
- [Leaflet.PolylineDecorator](https://github.com/bbecquet/Leaflet.PolylineDecorator) - For creating animated arrows
- [Turf.js](https://turfjs.org/) - For spatial analysis (area and length calculations)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- International Fund for Animal Welfare (IFAW)
- OpenStreetMap contributors for base map data