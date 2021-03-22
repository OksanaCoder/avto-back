const NodeGeocoder = require('node-geocoder');

const options = {
    provider: process.env.GEOCODER_PROVIDER,
    httpAdapter: "https",
    apiKey: process.env.GEOCODER_API_KEY, // for Mapquest, OpenCage, Google Premier
    formatter: null // 'gpx', 'string', ...
};

const geoCoder = NodeGeocoder(options);

module.exports = geoCoder;