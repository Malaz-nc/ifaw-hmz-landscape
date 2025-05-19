/**
 * Configuration file for IFAW Elephant Corridors Map
 */

// Configuration object
const CONFIG = {
    // Map settings
    map: {
        center: [-18.5, 26.3], // Centered on Hwange area, Zimbabwe
        zoom: 8,
        minZoom: 6,
        maxZoom: 18
    },
    
    // Base map layers
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
    },
    
    // Layer groups and file paths
    layers: {
        // Administrative boundaries
        landscapeboundary: {
            file: 'landscapeboundary.geojson',
            style: {
                color: '#FF0000',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.1
            }
        },
        districtboundaries: {
            file: 'Districtboundaries.geojson', // Corrected to match actual filename
            style: {
                color: '#9C27B0',
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.1
            }
        },
        bufferwards: {
            file: 'bufferwards.geojson',
            style: {
                color: '#2196F3',
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.2
            }
        },
        
        // Land types
        landuse: {
            file: 'landuse.geojson',
            style: {
                color: '#8BC34A',
                weight: 1,
                opacity: 0.7,
                fillOpacity: 0.3
            }
        },
        communityCa: {
            file: 'communityCA.geojson', // Corrected to match actual filename
            style: {
                color: '#FFEB3B',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.3
            }
        },
        matetsiunits: {
            file: 'matetsiunits.geojson',
            style: {
                color: '#FF9800',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.3
            }
        },
        
        // Features
        wildlife_corridors: {
            file: 'wildlife_corridors.geojson',
            style: {
                color: '#3F51B5',
                weight: 4,
                opacity: 0.9,
                fillOpacity: 0
            }
        },
        rivers: {
            file: 'rivers.geojson',
            style: {
                color: '#00BCD4',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0
            }
        },
        watersources: {
            file: 'watersources.geojson',
            style: {
                radius: 6,
                fillColor: '#03A9F4',
                color: '#0288D1',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }
        },
        roads: {
            file: 'roads.geojson',
            style: {
                color: '#795548',
                weight: 1.5,
                opacity: 0.7,
                fillOpacity: 0
            }
        },
        places: {
            file: 'places.geojson',
            style: {
                radius: 5,
                fillColor: '#9C27B0',
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }
        },
        towns: {
            file: 'towns.geojson',
            style: {
                radius: 7,
                fillColor: '#F44336',
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }
        },
        
        // IFAW activity areas
        projectsites: {
            file: 'projectsites.geojson',
            style: {
                color: '#4CAF50',
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0.5
            }
        }
    },
    
    // Legend configuration
    legend: {
        title: "Legend",
        items: [
            { label: "Landscape Boundary", color: "#FF0000", type: "line", weight: 3 },
            { label: "District Boundaries", color: "#9C27B0", type: "line", weight: 2 },
            { label: "IFAW Operating Wards", color: "#2196F3", type: "line", weight: 2 },
            { label: "Land Use", color: "#8BC34A", type: "polygon" },
            { label: "Community Conservation Areas", color: "#FFEB3B", type: "polygon" },
            { label: "Matetsi Safari Area", color: "#FF9800", type: "polygon" },
            { label: "Wildlife Corridors", color: "#3F51B5", type: "line", weight: 4 },
            { label: "Rivers", color: "#00BCD4", type: "line", weight: 2 },
            { label: "Water Sources", color: "#03A9F4", type: "point", radius: 6 },
            { label: "Roads", color: "#795548", type: "line", weight: 1.5 },
            { label: "Places", color: "#9C27B0", type: "point", radius: 5 },
            { label: "Towns", color: "#F44336", type: "point", radius: 7 },
            { label: "Project Sites", color: "#4CAF50", type: "polygon" }
        ]
    }
};

// Export the config object
// In case it's loaded as a module
if (typeof module !== 'undefined') {
    module.exports = CONFIG;
}