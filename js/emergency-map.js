document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM is ready. Checking for map errors and applying fixes...");
    
    // Force-create the map if it doesn't exist
    if (typeof map === 'undefined') {
        console.log("Map not defined, creating base map...");
        
        try {
            // Initialize a basic Leaflet map
            window.map = L.map('map', {
                center: [25.0, -18.0], // Default center if CONFIG is not available
                zoom: 6,
                minZoom: 4,
                maxZoom: 18
            });
            
            // Add a basic tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            console.log("Map initialized with default settings");
        } catch (error) {
            console.error("Failed to initialize map:", error);
            alert("There was an error creating the map. Please check console for details.");
        }
    }
    
    // Initialize allLayers if it doesn't exist
    if (typeof allLayers === 'undefined') {
        console.log("allLayers not defined, initializing empty object");
        window.allLayers = {};
    }
    
    // Define a simplified CONFIG if it doesn't exist
    if (typeof CONFIG === 'undefined') {
        console.log("CONFIG not defined, creating default configuration");
        
        window.CONFIG = {
            mapCenter: [-18.2, 27.5],
            initialZoom: 8,
            minZoom: 6,
            maxZoom: 18,
            
            // Default basemap layer
            basemaps: {
                OpenStreetMap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                })
            },
            
            // File paths - adjust these to your actual file locations
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
            
            // Basic color scheme
            colors: {
                communalLand: '#f7e5b7',
                forestArea: '#006400',
                safariArea: '#b8b242',
                communityCa: '#f5d08a',
                
                rivers: '#0078ff',
                wildlifeCorridors: '#ff0000',
                roads: {
                    category1: '#000000'
                }
            }
        };
    }
    
    // Check file paths
    console.log("Checking for common file path issues...");
    
    // Test loading one file to see if paths are correct
    fetch(CONFIG.geojsonPaths.landscapeboundary)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load landscape boundary (${response.status}): ${response.statusText}`);
            }
            console.log("Successfully accessed a data file. Paths seem to be correct.");
            return response.json();
        })
        .then(data => {
            console.log("Landscape boundary loaded successfully");
            
            // Create a simple layer to verify map functionality
            const testLayer = L.geoJSON(data, {
                style: {
                    color: '#000',
                    weight: 2,
                    fillOpacity: 0
                }
            }).addTo(map);
            
            // Fit map to this layer's bounds
            map.fitBounds(testLayer.getBounds());
            
            console.log("Test layer added successfully");
        })
        .catch(error => {
            console.error("Error loading test file:", error);
            alert("Cannot access data files. Check the file paths and server configuration.");
        });
        
    // Alert function
    window.showNotification = function(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = isError ? 'error-notification' : 'success-notification';
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = isError ? '#ff5555' : '#4CAF50';
        notification.style.color = 'white';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        notification.style.zIndex = '10000';
        notification.style.textAlign = 'center';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    };
    
    // Show a startup message
    window.showNotification("Map is initializing. Please wait...");
});