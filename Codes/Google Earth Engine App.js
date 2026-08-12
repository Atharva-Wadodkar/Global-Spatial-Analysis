// ===============================================
// 1. IMPORT GLOBAL BATHYMETRY (ETOPO1 BEDROCK)
// ===============================================

// ETOPO1 global relief: land topography + ocean bathymetry.
// It has a 'bedrock' band we can use for true terrain elevation.
var etopo = ee.Image('NOAA/NGDC/ETOPO1');

// Select the 'bedrock' band (elevation in meters; oceans are negative).
var depth = etopo.select('bedrock');

print('ETOPO1 bedrock band', depth);

// ===============================================
// 2. BUILD RASTER MASKS FOR DEEP-OCEAN ECOSYSTEMS
// ===============================================
//
// Convention: elevation is in meters; ocean depths are negative.
// We'll use simple depth thresholds based on your assignment:
//
// - Hadal trenches & troughs: deeper than 6000 m
// - Abyssal plains: 3000–6000 m
// - Continental & island slopes: 250–3000 m
// - Submarine canyons: approx. 200–1000 m depth with slopes > 6°.

// 2.1 Hadal trenches (> 6000 m deep)
var hadal = depth.lt(-6000).selfMask();

// 2.2 Abyssal plains (3000–6000 m)
var abyssal = depth.lt(-3000).and(depth.gte(-6000)).selfMask();

// 2.3 Continental & island slopes (250–3000 m)
var slopes = depth.lt(-250).and(depth.gte(-3000)).selfMask();

// 2.4 Submarine canyons (simplified)
// Compute approximate slope magnitude (degrees) from elevation.
var terrain = ee.Algorithms.Terrain(depth);
var slopeDeg = terrain.select('slope');

// Canyons: depth between 200 and 1000 m and steep slopes (> 6 deg).
var canyons = depth.lt(-200)
  .and(depth.gte(-1000))
  .and(slopeDeg.gt(6))
  .selfMask();

// ===============================================
// 3. ADD ECOSYSTEM LAYERS TO THE MAP
// ===============================================

Map.addLayer(hadal,   {palette: ['purple']}, 'Hadal trenches (>6000 m)');
Map.addLayer(abyssal, {palette: ['blue']},   'Abyssal plains (3000–6000 m)');
Map.addLayer(slopes,  {palette: ['green']},  'Slopes (250–3000 m)');
Map.addLayer(canyons, {palette: ['orange']}, 'Submarine canyons (approx.)');

// Start with a global ocean view.
Map.setCenter(0, 0, 2);

// ===============================================
// 4. IMPORT GLOBAL OCEAN SURFACE DYNAMICS (COPERNICUS)
// ===============================================
//
// Copernicus Marine Global Ocean Physics Analysis & Forecast Daily
// provides daily fields including sea-surface height ("zos") [web:101].

var phy = ee.ImageCollection('COPERNICUS/MARINE/GLOBAL_ANALYSISFORECAST_PHY_DAILY')
  .filterDate('2024-01-01', '2024-12-31');  // use a recent full year

print('Copernicus physics collection (sample)', phy.limit(5));

// Check band names for a sample image.
var sampleImg = ee.Image(phy.first());
print('Physics sample bands', sampleImg.bandNames());

// ===============================================
// 5. SEA-SURFACE HEIGHT VARIABILITY (FRONTS / EDDIES)
// ===============================================
//
// We use sea surface height ("zos") as a proxy for surface dynamics.
// High temporal variability (standard deviation) marks energetic regions,
// associated with fronts, eddies and strong current systems.

// Compute standard deviation of zos over the year.
var zosStd = phy.select('zos').reduce(ee.Reducer.stdDev());

print('Sea-surface height std dev', zosStd);

// Visualisation: highlight dynamic regions.
var zosStdVis = {
  min: 0.0,
  max: 0.2,  // adjust if needed after inspecting values
  palette: ['000033', '0000ff', '00ffff', '00ff00', 'ffff00', 'ff0000']
};

Map.addLayer(zosStd, zosStdVis, 'Sea-surface height variability (std dev, 2024)', true, 0.65);

// ===============================================
// 6. LEGEND FOR ECOSYSTEMS + SURFACE DYNAMICS
// ===============================================

// Create a legend panel.
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '10px',
    backgroundColor: 'white',
    width: '220px'
  }
});

// Legend title.
legend.add(ui.Label({
  value: 'Deep-sea ecosystems & surface dynamics',
  style: {
    fontWeight: 'bold',
    fontSize: '14px',
    margin: '0 0 8px 0'
  }
}));

// Helper function for categorical legend items.
var addLegendEntry = function(color, name) {
  var colorBox = ui.Label({
    style: {
      backgroundColor: color,
      padding: '8px',
      margin: '0 6px 4px 0'
    }
  });

  var label = ui.Label({
    value: name,
    style: {
      margin: '0 0 4px 0',
      fontSize: '12px'
    }
  });

  var row = ui.Panel({
    widgets: [colorBox, label],
    layout: ui.Panel.Layout.Flow('horizontal')
  });

  legend.add(row);
};

// Add deep-sea ecosystem entries.
addLegendEntry('purple', 'Hadal trenches (>6000 m)');
addLegendEntry('blue', 'Abyssal plains (3000–6000 m)');
addLegendEntry('green', 'Slopes (250–3000 m)');
addLegendEntry('orange', 'Submarine canyons (approx.)');

// Add a spacer.
legend.add(ui.Label({
  value: ' ',
  style: {margin: '4px 0'}
}));

// Add heading for continuous sea-surface layer.
legend.add(ui.Label({
  value: 'Sea-surface height variability (2024)',
  style: {
    fontWeight: 'bold',
    fontSize: '12px',
    margin: '0 0 6px 0'
  }
}));

// Create a colour bar using a thumbnail image.
var gradient = ee.Image.pixelLonLat().select('longitude');
var gradientVis = {
  min: 0,
  max: 1,
  palette: ['000033', '0000ff', '00ffff', '00ff00', 'ffff00', 'ff0000']
};

var colorBar = ui.Thumbnail({
  image: gradient,
  params: {
    bbox: [0, 0, 1, 0.1],
    dimensions: '250x20',
    format: 'png',
    min: 0,
    max: 1,
    palette: gradientVis.palette
  },
  style: {
    stretch: 'horizontal',
    margin: '0px 8px',
    maxHeight: '20px'
  }
});

legend.add(colorBar);

// Add labels below the colour bar.
var colorBarLabels = ui.Panel({
  widgets: [
    ui.Label('Low', {margin: '4px 8px 0 8px', fontSize: '11px'}),
    ui.Label('Medium', {
      margin: '4px 8px 0 8px',
      fontSize: '11px',
      textAlign: 'center',
      stretch: 'horizontal'
    }),
    ui.Label('High', {margin: '4px 8px 0 8px', fontSize: '11px'})
  ],
  layout: ui.Panel.Layout.Flow('horizontal')
});

legend.add(colorBarLabels);

// Optional explanation line.
legend.add(ui.Label({
  value: 'Dark blue = stable ocean surface, red = highly dynamic regions',
  style: {
    fontSize: '11px',
    color: 'gray',
    margin: '6px 0 0 0'
  }
}));

// Add legend to map.
Map.add(legend);
