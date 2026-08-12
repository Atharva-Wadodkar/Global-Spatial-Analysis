// Starting a new project for MB5370 Module in Google Earth Engine. 
//*******************************//

// Learning JavaScript
//*******************************//

print ('Hello World')

// Running numeric variable 
var the_answer = 42
print (the_answer)
//

// Running place varuable 
var city = 'Dubai'
print (city)
// prints the city name

// Running population variable 
var population = 5638890
print (population)
// prints the population number 

// Stitching variables 
print ('The city is', city, 'population is', population)
// print as The city is Dubai, population is 5638890

// List
var cities = ['Dubai', 'Sharjah', 'Abu Dhabi', 'Fujairah'];
print (cities)
// Lists cities as 
// 0: Dubai
// 1: Sharjah
// etc ....

// Dictionaries 
var cityData = { 
  'city': 'Dubai',
  'coord': [122.2, 37.77],
  'pop': 5638890
}
print (cityData)
// Lists the object dictioary 

// Functions can be defined as a way to reuse code and make it easier to read
var my_hello_function = function(string) {
  return 'Hello ' + string + '!';
};
print(my_hello_function('world'));
// Prints as Hello World!

// Another example of Earth Engine function 
var greet = function(name) {
    return 'Hello ' + name;
};
print(greet('World'));
print(greet('Readers'));

// Random example using variables and functions
var sentense = function(string) { 
  return 'Welcome to dubai' + string + '!!';
};
print (sentense('Welcome to Dubai'));
print(sentense('!!'));
//

// Using earth engine server 
var a = ee.Number(1)
var b = ee.Number(9)
var result = print (a.add(b))
// no exact benifit but can help with calculating larger variables/values

// Creating a list sequence 
var yearList = ee.List.sequence(1950, 2020, 5)
print (yearList)
// Lists the years from 1950 to 2020 with 5 year intervals.

// Data structure 
Map.setOptions('SATELLITE')
// Sets the map into satellite view 

// 
Map.setOptions('SATELLITE')
// var snazzy = require("users/aazuspan/snazzy:styles");
//snazzy.addStyle("https://snazzymaps.com/style/72543/assassins-creed-iv", "Assasin's Creed IV");
// Changes map style to whatever you want 

//
Map.setCenter(174.0638, -39.298, 11);
// Takes you to the coordinates on the map 

// Import SRTM data
var dataset = ee.Image("CGIAR/SRTM90_V4")
print (dataset) 
// Look at the data properties

// Now we know where the data is (via the Asset ID), add it to our map.
 Map.addLayer(dataset, {min: 0, max: 5500, palette: ['blue', 'green', 'red', 'white']}, 'srtm');
// Creates gradient layers using colour palette 

// Add the protected planet data
var wdpa = ee.FeatureCollection("WCMC/WDPA/current/polygons")
Map.addLayer(wdpa, {color: 'green'}, 'wdpa')
// Adds color to all wdpa areas

