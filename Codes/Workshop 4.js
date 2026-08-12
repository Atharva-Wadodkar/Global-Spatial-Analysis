// 1. Global variables
var distance = 800;   // metres allowed to snorkel from station
Map.setOptions('SATELLITE');

// 2. Research station locations

// Create each station as a Feature with a station name property
var LizardIsland = ee.Feature(
  ee.Geometry.Point([145.44647541, -14.66767257]),
  {station: 'Lizard Island'}
);

var OrpheusIsland = ee.Feature(
  ee.Geometry.Point([146.49992691, -18.63411616]),
  {station: 'Orpheus Island'}
);

// Put features into a FeatureCollection
var field_stations = ee.FeatureCollection([
  LizardIsland,
  OrpheusIsland
]);

print('Field stations', field_stations);
Map.centerObject(field_stations, 2);
Map.addLayer(LizardIsland,  {color: 'red'},    'Lizard Island');
Map.addLayer(OrpheusIsland, {color: 'yellow'}, 'Orpheus Island');

// 3. Import the ACA data
var aca = ee.Image('ACA/reef_habitat/v2_0');
print('Allen Coral Atlas image', aca);

// Add ACA to map to inspect it
Map.addLayer(aca, {}, 'ACA raw image', false);

var benthic = aca.select('benthic');
var coralClassValue = 15;   // replace if needed
var coralOnly = benthic.eq(coralClassValue).selfMask();

Map.addLayer(coralOnly, {palette: ['cyan']}, 'Coral reef');

// 5. Buffering stations
// Test buffering on one feature only first
var buffered_one = ee.Feature(field_stations.first()).buffer(distance);
Map.addLayer(buffered_one, {color: 'Yellow'}, 'Single station buffer', false);
  
// 6. Mapping a function over all stations
// Function takes one feature, buffers it, returns buffered feature
var makeBuffer = function(feature) {
  return feature.buffer(distance);
};

// Apply function to all features
var station_buffers = field_stations.map(makeBuffer);

print('All station buffers', station_buffers);
Map.addLayer(station_buffers, {color: 'orange'}, 'All station buffers');

// 7. Clip coral to buffered stations
// Turn all buffers into one geometry
var buffer_union = station_buffers.union().geometry();

// Coral close enough to stations for snorkelling
var accessible_coral = coralOnly.clip(buffer_union);
Map.addLayer(accessible_coral, {palette: ['green']}, 'Accessible coral');

// 8. Calculate coral area
var coralAreaImage = ee.Image.pixelArea().updateMask(coralOnly);
var accessibleAreaImage = ee.Image.pixelArea().updateMask(accessible_coral);

// Total coral area in map region / study region
var totalCoralArea = coralAreaImage.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: buffer_union.bounds(),
  scale: 5,
  maxPixels: 1e13
});

var accessibleCoralArea = accessibleAreaImage.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: buffer_union,
  scale: 5,
  maxPixels: 1e13
});

print('Total coral area in study extent (m2)', totalCoralArea);
print('Accessible coral area within station buffers (m2)', accessibleCoralArea);

// 9. Coral area per station
// For each buffered station, sum coral area inside that buffer
var coralPerStation = station_buffers.map(function(bufferFeat) {
  var geom = bufferFeat.geometry();

// pixelArea image masked by coralOnly
  var area = ee.Image.pixelArea()
    .updateMask(coralOnly)
    .reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: geom,
      scale: 5,
      maxPixels: 1e13
    })
    .get('area');   // pick the 'area' result from the dictionary

  // return a new Feature with station name + coral area
  return ee.Feature(geom, {
    station: bufferFeat.get('station'),
    coral_m2: area
  });
});

// Sort stations by coral area (largest first)
var coralPerStationSorted = coralPerStation.sort('coral_m2', false);

// Print table to Console
print('Coral area per station (sorted)', coralPerStationSorted);


// Export each station individually

// Lizard Island
var lizardBuffer = LizardIsland.buffer(distance);

var lizardCoralArea = ee.Image.pixelArea()
  .updateMask(coralOnly)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: lizardBuffer.geometry(),
    scale: 5,
    maxPixels: 1e13
  })
  .get('area');

var lizardFeature = ee.Feature(lizardBuffer.geometry(), {
  station: 'Lizard Island',
  buffer_m: distance,
  coral_m2: lizardCoralArea
});

Export.table.toDrive({
  collection: ee.FeatureCollection([lizardFeature]),
  description: 'exportLizardIslandCoral',
  fileNamePrefix: 'lizard_island_coral',
  fileFormat: 'CSV'
});


// Orpheus Island
var orpheusBuffer = OrpheusIsland.buffer(distance);

var orpheusCoralArea = ee.Image.pixelArea()
  .updateMask(coralOnly)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: orpheusBuffer.geometry(),
    scale: 5,
    maxPixels: 1e13
  })
  .get('area');

var orpheusFeature = ee.Feature(orpheusBuffer.geometry(), {
  station: 'Orpheus Island',
  buffer_m: distance,
  coral_m2: orpheusCoralArea
});

Export.table.toDrive({
  collection: ee.FeatureCollection([orpheusFeature]),
  description: 'exportOrpheusIslandCoral',
  fileNamePrefix: 'orpheus_island_coral',
  fileFormat: 'CSV'
});
