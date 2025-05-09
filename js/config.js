const CONFIG = {
    // Initial map center coordinates (Hwange area)
    mapCenter: [-18.3, 26.5],
    
    // Initial zoom level
    initialZoom: 7,
    
    // Min/max zoom levels
    minZoom: 6,
    maxZoom: 16,
    
    // Buffer radius for chiefs (in kilometers)
    chiefBufferRadius: 15,
    
    // Colors for land types (matching the static map)
    colors: {
        communalLand: '#f7e5b7',        // Light beige
        targetForestLand: '#1e7a1e',    // Dark green
        largeScaleFarming: '#6c8a6c',   // Medium green
        nationalPark: '#77ec77',        // Bright green
        safariArea: '#b8b242',          // Olive green
        smallScaleFarming: '#d1cb9e',   // Light tan
        communityCa: '#f5d08a',         // Light orange
        
        // Other features
        rivers: '#8acef5',              // Light blue
        wildlifeCorridors: '#ff0000',   // Red
        chiefBuffers: '#22ff22',        // Green for buffers
        roads: {
            category1: '#000000',       // Black
            category2: '#555555',       // Dark gray
            category3: '#999999'        // Light gray
        }
    },
    
    // GeoJSON file paths
    geojsonPaths: {
        bufferwards: 'data/bufferwards.geojson',
        category1Road: 'data/category1_road.geojson',
        category2Road: 'data/category2_road.geojson',
        category3Road: 'data/category3_road.geojson',
        chiefs: 'data/chiefs.geojson',
        communityCa: 'data/Community_CA.geojson',
        corridors: 'data/corridors.geojson',
        hmzBoundary: 'data/HMZ_Boundary.geojson',
        landscapeBoundary: 'data/Landscape_boundary.geojson',
        landuse: 'data/Landuse.geojson',
        landuse2: 'data/Landuse2.geojson',
        pointsOfInterest: 'data/Places_of_interest.geojson',
        rivers: 'data/rivers.geojson',
        wards: 'data/wards.geojson',
        waterSources: 'data/water_sources.geojson'
    },
    
    // Basemap options
    basemaps: {
        OpenStreetMap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }),
        Satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }),
        Topographic: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        })
    }
};