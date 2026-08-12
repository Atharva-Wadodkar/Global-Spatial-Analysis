var geometry = 
    /* color: #98ff00 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[72.4486442959942, 19.422178039982448],
          [72.4486442959942, 18.382810708712356],
          [73.6900993741192, 18.382810708712356],
          [73.6900993741192, 19.422178039982448]]], null, false);

// Let’s take a look, first at population.
var population = ee.ImageCollection("CIESIN/GPWv411/GPW_Population_Count");
print (population)
//

// Then pull out only the images for the years we want.
//import two images for start and end
var population_2000 = ee.Image('CIESIN/GPWv411/GPW_Population_Count/gpw_v4_population_count_rev11_2000_30_sec');
var population_2015 = ee.Image('CIESIN/GPWv411/GPW_Population_Count/gpw_v4_population_count_rev11_2015_30_sec');
print (population_2000)
//

// And now let’s visualise them and have a look.
var population_vis = {
  'min': 0.0,
  'max': 100.0,
  'palette': [
    'seagreen',
    'mediumseagreen',
    'yellowgreen',
    'gold',
    'darkorange',
    'orangered',
    'firebrick'
  ],
};
// Map.addLayer(population_2000, population_vis, 'population_count_2000');
// Map.addLayer(population_2015, population_vis, 'population_count_2015');
//

// Right, now let’s do the same with nightlights, starting with importing the data.
// Nightlights
var nl = ee.ImageCollection("NOAA/DMSP-OLS/NIGHTTIME_LIGHTS");
print (nl)
//

// Get the two images of interest.
// get two images for start and end
var nl_2000 = ee.Image ('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS/F142000');
var nl_2013 = ee.Image ('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS/F182013');
print (nl_2000)
print (nl_2013)
//

// Let’s select that band and proceed with our analysis. We can use a special argument to select which changes the band name from ‘avg_vis’ to ‘nightlight’.
var nl_2000 = ee.Image ('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS/F142000').select(['avg_vis'], ['nightlight']) //select and rename
var nl_2013 = ee.Image ('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS/F182013').select(['avg_vis'], ['nightlight'])
print ('nightlight 2000 processed', nl_2000)
print ('nightlight 2013 processed', nl_2013)

// Define visualization parameters for nighttime lights
var nighttimeLightsVis = {
  min: 3.0,
  max: 60.0,
  palette: [
    'black', // Very low intensity
  'darkred', // low-medium
  'firebrick', // medium
  'red', // high
  'orangered', // saturated
  ]
};

// Map.addLayer(nl_2000, nighttimeLightsVis, 'Nighttime Lights 2000');
// Map.addLayer(nl_2013, nighttimeLightsVis, 'Nighttime Lights 2013');
//

// Import your grid
var grid = ee.FeatureCollection('users/murrnick/mb5370/worldgrid_1deg');
Map.addLayer(grid, {color: 'blue'}, 'grid');

// Import coastlines
var coast = ee.FeatureCollection('projects/UQ_intertidal/dataMasks/naturalEarthCoastline_v1');
Map.addLayer(coast, {color: 'green'}, 'coast');

// Spatially filter grid to coast
var coastEcoregions = grid.filterBounds(coast);
Map.addLayer(coastEcoregions, {color: 'yellow'}, 'coastal 1 degree grid');

// Optional check
// print('total grid cells:', grid.size());
//

// Filter ecoregions to bounds
var coast_ecoregions = grid
.filter(ee.Filter.bounds(coast))
// .filter(ee.Filter.bounds(geometry)) // let's limit it for testing
// print('coastalEcoregions:', grid.size());
Map.addLayer(coast_ecoregions, {color:'firebrick'}, 'coastal ecoregions')

var pop_change = population_2015
  .subtract(population_2000)
  .clip(coast_ecoregions)
Map.addLayer (pop_change, {palette:  ['red', 'black', 'lime'], min: -500, max: 500}, 'pop_change', true, 0.9)

// And the same for nightlights. 
var nl_change = nl_2013
  .subtract(nl_2000)
  .clip(coast_ecoregions)
Map.addLayer (nl_change, {palette: ['red', 'black', 'lime'], min: -50, max: 50}, 'nl_change', true, 0.9)

// average change in nightlights per ecoregion
var nl_changePerEcoregion = nl_change.reduceRegions({
  collection: coast_ecoregions, 
  reducer: ee.Reducer.mean(), 
  scale: 1000, // note computing at a larger scale for speed
});
print (nl_changePerEcoregion.first()) // look at properties of the first one

// average change in population per ecoregion
var pop_changePerEcoregion = pop_change.reduceRegions({
  collection: coast_ecoregions, 
  reducer: ee.Reducer.mean(), 
  scale: 1000, 
});

// Export the result
// Approx 10-20 minute export for scale = 1000.
// Export the result to asset
Export.table.toAsset({
  collection: pop_changePerEcoregion, //
  description: 'export_pop_toAsset',
  assetId:'pop_changePerEcoregion'
});

Export.table.toAsset({
  collection: nl_changePerEcoregion, //
  description: 'export_nl_toAsset',
  assetId:'nl_changePerEcoregion'
});

// Visualise your data
var pop_result = ee.FeatureCollection('projects/corded-keel-472600-i8/assets/pop_changePerEcoregion');
Map.addLayer(pop_result)
print (pop_result)
print (pop_result.limit(10))

// Visualise result
var empty = ee.Image().byte() // make an empty image
var palette = ['green','yellow', 'orange', 'red'];
var popChangePerEcoregion = empty.paint({
  featureCollection: pop_result,
  color:'mean'
})

Map.addLayer(popChangePerEcoregion, {max: 50, min: -50, palette: palette}, 'popChange_result')

