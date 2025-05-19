// Configuration for the map
const CONFIG = {
    // Map settings
    mapCenter: [-18.2, 27.5], // Latitude, Longitude
    initialZoom: 8,
    minZoom: 6,
    maxZoom: 18,
    
    // Basemap layers
    basemaps: {
        OpenStreetMap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }),
        Satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }),
        Topographic: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
        })
    },
    
    // GeoJSON data paths - updated to match the file names in the screenshot
    geojsonPaths: {
        bufferwards: 'data/bufferwards.geojson',
        communityCa: 'data/communityCa.geojson',
        corridors: 'data/corridors.geojson',
        districtboundaries: 'data/DistrictBoundaries.geojson',
        landscapeboundary: 'data/landscapeboundary.geojson',
        landuse: 'data/landuse.geojson',
        matetsiunits: 'data/matetsiunits.geojson',
        places: 'data/places.geojson',
        projectsites: 'data/projectsites.geojson',
        rivers: 'data/rivers.geojson',
        roads: 'data/roads.geojson',
        towns: 'data/towns.geojson',
        watersources: 'data/watersources.geojson',
        wildlife_corridors: 'data/wildlife_corridors.geojson'
    },
    
    // Colors for map styling
    colors: {
        communalLand: '#f7e5b7',        // Light beige
        targetForestLand: '#006400',    // Dark green for forest areas
        forestArea: '#006400',          // Dark green for forest areas
        largeScaleFarming: '#6c8a6c',   // Medium green
        nationalPark: '#7eff7e',        // Bright green for National Parks
        safariArea: '#b8b242',          // Olive green/yellow for Safari Areas
        smallScaleFarming: '#d1cb9e',   // Light tan
        communityCa: '#f5d08a',         // Light orange
        
        // Other features
        rivers: '#0078ff',              // Bright blue for rivers
        wildlifeCorridors: '#ff0000',   // Red for corridors
        chiefBuffers: '#ff0000',        // Red for chief buffers
        ifawOperatingWards: '#0077ff',  // Blue for IFAW operating wards
        wards: '#000000',               // Black for ward boundaries
        ifawProjectSites: '#ff9900',    // Orange for IFAW project sites
        ifawProposedSites: '#9900cc',   // Purple for IFAW proposed sites
        roads: {
            category1: '#000000',       // Black
            category2: '#555555',       // Dark gray
            category3: '#999999'        // Light gray
        }
    },
    
    // Buffer radius in kilometers for chiefs
    chiefBufferRadius: 15
};