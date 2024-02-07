document.getElementById('distanceForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const fromZip = document.getElementById('fromZip').value;
    calculateDistance(fromZip);
});

function calculateDistance(fromZip) {
    Papa.parse('./assets/zips/us-zips-02-2024.csv', {
        download: true,
        complete: function (results) {
            const data = results.data;
            const header = ['To Zip', 'City', 'State Name', 'State', 'County', 'Lat', 'Long'];
            const distances = [];

            // Find column indexes
            const toZipIndex = header.indexOf('To Zip');
            const latIndex = header.indexOf('Lat');
            const longIndex = header.indexOf('Long');

            // Filter rows to find the one corresponding to the 'From Zip'
            const fromZipRow = data.find((row) => row[toZipIndex] === fromZip);

            if (!fromZipRow) {
                console.error('From Zip not found in the CSV data.');
                return;
            }

            // Latitude and longitude of the 'From Zip'
            const fromLat = parseFloat(fromZipRow[latIndex]);
            const fromLng = parseFloat(fromZipRow[longIndex]);

            // Filter out header row
            const rows = data.slice(1);

            // Calculate distances and categorize into zones
            rows.forEach(function (row) {
                const distance = calculateDistanceBetweenPoints(row[latIndex], row[longIndex], fromLat, fromLng);
                row.push(fromZip); // From Zip
                row.push(distance); // Distance Miles
                row.push(categorizeZone(distance)); // Zone
                distances.push(row);
            });

            // Add headers for From Zip, Distance Miles, and Zone
            header.push('From Zip', 'Distance Miles', 'Zone');

            // Generate CSV
            const sortedDistances = distances.sort(
                (a, b) =>
                    parseFloat(a[header.indexOf('Distance Miles')]) - parseFloat(b[header.indexOf('Distance Miles')])
            );
            generateCSV([header, ...sortedDistances], fromZip);
        },
    });
}

function calculateDistanceBetweenPoints(lat2, lon2, fromLat, fromLng) {
    const R = 3958.8; // Radius of the earth in miles
    const lat1 = fromLat; // Latitude of the starting point
    const lon1 = fromLng; // Longitude of the starting point
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in miles
    return distance.toFixed(2); // Round to 2 decimal places
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function categorizeZone(distance) {
    if (distance >= 0 && distance <= 50) return 1;
    else if (distance <= 150) return 2;
    else if (distance <= 300) return 3;
    else if (distance <= 600) return 4;
    else if (distance <= 1000) return 5;
    else if (distance <= 1400) return 6;
    else if (distance <= 1800) return 7;
    else return 8;
}

function generateCSV(data, fromZip) {
    const csvContent = 'data:text/csv;charset=utf-8,' + data.map((row) => row.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'zones_' + fromZip + '.csv');
    document.getElementById('result').innerHTML = '<a href="' + encodedUri + '" download>Download Output CSV</a>';
}
