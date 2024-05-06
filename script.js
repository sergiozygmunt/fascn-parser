function submitData() {
    const data = document.getElementById('pivData').value;
    const result = parsePIVData(data);
    document.getElementById('result').textContent = JSON.stringify(result, null, 2);
}

function parsePIVData(data) {
    const parsedData = {};
    const regexPatterns = {
        csn: /CSN:\s*([A-F0-9]+)/i,
        fascN: /FASC-N:\s*([A-F0-9]+)/i,
        guid: /GUID:\s*([A-F0-9]+)/i,
        gsa: /75-bit GSA:\s*([A-F0-9]+)/i
    };

    // Extracting each part using regular expressions
    for (const [key, regex] of Object.entries(regexPatterns)) {
        const match = data.match(regex);
        if (match && key === 'fascN') {
            parsedData[key] = parseFascN(match[1]);
        } else {
            parsedData[key] = match ? match[1] : 'Not found';
        }
    }

    return parsedData;
}

function parseFascN(hex) {
    // Convert hex to binary, considering LSB first
    const binary = hexToBinary(hex);
    // This array should contain the correct lengths of each segment in bits, including parity bits
    const segmentLengths = [5, 20, 5, 20, 5, 30, 5, 5, 5, 50, 5, 20, 5, 5, 5];
    let currentIndex = 0;

    return {
        "Agency Code": parseSegment(binary, currentIndex += segmentLengths[0], 4),
        "System Code": parseSegment(binary, currentIndex += segmentLengths[1], 4),
        "Credential Number": parseSegment(binary, currentIndex += segmentLengths[2], 6),
        "Credential Series": parseSegment(binary, currentIndex += segmentLengths[3], 1),
        "Individual Credential Issue": parseSegment(binary, currentIndex += segmentLengths[4], 1),
        "Person Identifier": parseSegment(binary, currentIndex += segmentLengths[5], 10),
        "Organizational Category": parseSegment(binary, currentIndex += segmentLengths[6], 1),
        "Organizational Identifier": parseSegment(binary, currentIndex += segmentLengths[7], 4),
        "Affiliation": parseSegment(binary, currentIndex += segmentLengths[8], 1)
    };
}

function hexToBinary(hex) {
    return hex.split('').reduce((acc, h) => {
        return parseInt(h, 16).toString(2).padStart(4, '0') + acc;
    }, '');
}

function parseSegment(binary, start, length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        let byte = binary.substr(start + i * 5, 5); // 4 bits for the digit + 1 parity bit
        result += parseInt(byte.substr(0, 4), 2).toString(); // Skip the parity bit for now
    }
    return result;
}


function binaryToBCD(binary) {
    let result = '';
    // Assuming each 5-bit segment represents one BCD digit with odd parity
    for (let i = 0; i < binary.length; i += 5) {
        let segment = binary.substr(i, 5);
        let digitBits = segment.substr(0, 4); // First four bits are the digit bits
        let parityBit = segment[4]; // Fifth bit is the parity bit

        // Convert the binary digit bits to a decimal number
        let digit = parseInt(digitBits, 2).toString();

        // Optionally check parity (you can implement parity check if needed)
        let isValidParity = checkParity(segment);

        if (isValidParity) {
            result += digit;
        } else {
            // Handle parity error, e.g., by throwing an error or correcting the data
            console.error(`Parity error with digit: ${digit}`);
        }
    }
    return result;
}

function checkParity(bits) {
    // Count the number of 1s and ensure it is odd
    let count = bits.split('').reduce((acc, b) => acc + (b === '1' ? 1 : 0), 0);
    return count % 2 !== 0;
}
