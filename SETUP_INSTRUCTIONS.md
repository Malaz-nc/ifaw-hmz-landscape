# IFAW HMZ Landscape Map - Setup Instructions

## Prerequisites

1. A web browser (Chrome, Firefox, or Edge recommended)
2. Your GeoJSON data files for the Hwange-Matetsi-Zambezi landscape

## Setup Steps

### 1. File Structure Setup

Make sure your files are organized as follows:

```
ifaw-hmz-landscape/
├── data/                 # Contains all GeoJSON files
│   ├── bufferwards.geojson
│   ├── category1_road.geojson
│   ├── category2_road.geojson
│   ├── category3_road.geojson
│   ├── chiefs.geojson
│   ├── Community_CA.geojson
│   ├── corridors.geojson
│   ├── HMZ_Boundary.geojson
│   ├── Landscape_boundary.geojson
│   ├── Landuse.geojson
│   ├── Landuse2.geojson
│   ├── Places_of_interest.geojson
│   ├── rivers.geojson
│   ├── wards.geojson
│   └── water_sources.geojson
├── images/               # Contains images
│   ├── ifaw.png          # Your IFAW logo (must be named exactly "ifaw.png")
│   ├── favicon.svg       # Created automatically
│   └── north-arrow.svg   # Created automatically
├── css/
│   └── style.css         # CSS styling
├── js/
│   ├── config.js         # Configuration settings
│   └── map.js            # Main JavaScript functionality
├── index.html            # Main HTML file
└── README.md             # Documentation
```

### 2. IFAW Logo Setup

Make sure you have your IFAW logo image named exactly `ifaw.png` in the `images/` folder. This is important as the HTML is looking for this specific filename.

### 3. Data File Requirements

- All GeoJSON files must be valid JSON format
- The names must match exactly as listed above
- Land use files must have a `LANDTYPE` property with values like "Communal Land", "National Park", etc.

### 4. Troubleshooting Common Issues

If the map appears blank or you see errors in the console:

1. **Image Loading Errors**:
   - Verify that your IFAW logo is named exactly `ifaw.png` and placed in the `images/` folder

2. **GeoJSON Loading Errors**:
   - Check that all GeoJSON files exist in the `data/` folder
   - Verify that they're valid GeoJSON format (use a validator like jsonlint.com)
   - Ensure the filenames match exactly what's expected

3. **Blank Map**:
   - Open your browser's developer tools (F12 or right-click > Inspect)
   - Look in the Console tab for any error messages
   - Verify that the basemap is loading correctly (check network tab for any 404 errors)

4. **Layers Not Displaying**:
   - Make sure your GeoJSON files have the correct geometry types (points, lines, polygons)
   - Check that the required properties exist in each file

### 5. Viewing the Map

- Open `index.html` in your web browser
- If using a local server, navigate to the appropriate URL
- You should see the IFAW logo, title, map, and sidebar controls

### 6. GitHub Pages Deployment

To deploy to GitHub Pages:

1. Push your repository to GitHub:
   ```
   git add .
   git commit -m "Initial map setup"
   git push origin main
   ```

2. In the GitHub repository settings, enable GitHub Pages:
   - Go to Settings > Pages
   - Set the source to "main" branch
   - Save the settings

3. Your map will be available at `https://username.github.io/ifaw-hmz-landscape/`

## Additional Customization

- Edit `js/config.js` to change map settings, colors, and initial view
- Modify `css/style.css` to adjust the appearance
- Update `js/map.js` to change the functionality

## Support

For technical issues or additional customizations, please contact your developer for assistance.