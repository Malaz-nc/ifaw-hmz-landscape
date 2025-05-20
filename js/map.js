// Initialize the map centered on Hwange-Matetsi-Zambezi area
const map = L.map('map').setView([-18.5, 26], 8);

// Add OpenStreetMap as the base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Function to determine color based on the designation
function getColor(designation) {
    // Default color if designation doesn't match any case
    let color = '#AAAAAA';
    
    // Convert designation to lowercase for case-insensitive comparison
    const desig = designation ? designation.toLowerCase() : '';
    
    // Assign colors based on designation types
    if (desig.includes('national park')) {
        color = '#90EE90'; // Light green for National Parks
    } else if (desig.includes('forest') || desig.includes('state forest')) {
        color = '#006400'; // Dark green for Forest areas
    } else if (desig.includes('safari') || desig.includes('game reserve')) {
        color = '#F5DEB3'; // Beige for Safari areas
    } else if (desig.includes('community') || desig.includes('conservancy')) {
        color = '#D2B48C'; // Tan/Brown for Community Conservation Areas
    }
    
    return color;
}

// Style function for GeoJSON features
function style(feature) {
    return {
        fillColor: getColor(feature.properties.desig),
        weight: 1,
        opacity: 1,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    };
}

// Function to add interactivity to each feature
function onEachFeature(feature, layer) {
    // Create a popup with feature information
    if (feature.properties) {
        let popupContent = '<div class="popup-content">';
        
        // Add designation if available
        if (feature.properties.desig) {
            popupContent += `<strong>Designation:</strong> ${feature.properties.desig}<br>`;
        }
        
        // Add name if available
        if (feature.properties.name) {
            popupContent += `<strong>Name:</strong> ${feature.properties.name}<br>`;
        }
        
        // Add any other relevant properties you want to display
        popupContent += '</div>';
        
        layer.bindPopup(popupContent);
    }
    
    // Add hover effects
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight
    });
}

// Highlight feature function
function highlightFeature(e) {
    const layer = e.target;
    
    layer.setStyle({
        weight: 3,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.9
    });
    
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

// Reset highlight function
function resetHighlight(e) {
    landUseLayer.resetStyle(e.target);
}

// Create a legend for the map
function createLegend() {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'info legend');
        const categories = [
            { name: 'National Park', value: 'national park' },
            { name: 'Forest/State Forest', value: 'forest' },
            { name: 'Safari Area', value: 'safari' },
            { name: 'Community Conservation', value: 'community' },
            { name: 'Other', value: '' }
        ];
        
        div.innerHTML = '<h4>Land Designation</h4>';
        
        // Loop through our categories and generate a label with a colored square for each
        for (let i = 0; i < categories.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(categories[i].value) + '"></i> ' +
                categories[i].name + '<br>';
        }
        
        return div;
    };
    
    return legend;
}

// Load the landuse GeoJSON data
let landUseLayer;
fetch('data/landuse.geojson')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        // Add GeoJSON to map with styling and interactivity
        landUseLayer = L.geoJSON(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
        
        // Fit the map to the bounds of the GeoJSON layer
        map.fitBounds(landUseLayer.getBounds());
        
        // Add the legend to the map
        createLegend().addTo(map);
    })
    .catch(error => {
        console.error('Error loading GeoJSON data:', error);
        document.getElementById('map').innerHTML = '<p class="error-message">Error loading map data. Please check the console for details.</p>';
    });