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
    const binary = hexToBinary(hex);
    return {
        "Agency Code": binaryToBCD(binary.substring(0, 32)), // 4 BCD digits
        "System Code": binaryToBCD(binary.substring(32, 64)), // next 4 BCD digits
        "Credential Number": binaryToBCD(binary.substring(64, 112)), // next 6 BCD digits
        "Credential Series": binaryToBCD(binary.substring(112, 120)), // next 1 BCD digit
        "Individual Credential Issue": binaryToBCD(binary.substring(120, 128)), // next 1 BCD digit
        "Person Identifier": binaryToBCD(binary.substring(128, 228)), // next 10 BCD digits
        "Organizational Category": binaryToBCD(binary.substring(228, 236)), // next 1 BCD digit
        "Organizational Identifier": binaryToBCD(binary.substring(236, 268)), // next 4 BCD digits
        "Affiliation": binaryToBCD(binary.substring(268, 276)) // next 1 BCD digit
    };
}

function hexToBinary(hex) {
    return hex.split('').reduce((acc, h) => acc + parseInt(h, 16).toString(2).padStart(4, '0'), '');
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
