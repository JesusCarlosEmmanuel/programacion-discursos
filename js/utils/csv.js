export const CSVUtils = {
    // Basic CSV parser holding into account quotes and commas inside fields
    parseCSV(text) {
        const result = [];
        let row = [];
        let inQuotes = false;
        let currentValue = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentValue += '"';
                    i++; // skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                row.push(currentValue.trim());
                currentValue = '';
            } else if (char === '\n' && !inQuotes) {
                row.push(currentValue.trim());
                if (row.length > 0 && row.some(v => v !== '')) {
                    result.push(row);
                }
                row = [];
                currentValue = '';
            } else if (char !== '\r') {
                currentValue += char;
            }
        }

        // Add last field/row if anything's left
        if (currentValue || row.length > 0) {
            row.push(currentValue.trim());
            if (row.some(v => v !== '')) {
                result.push(row);
            }
        }

        return result;
    },

    // A helper to detect if it's a tab separated (like direct copy-paste from Excel) or comma
    parseAuto(text) {
        if (text.indexOf('\t') !== -1 && text.indexOf(',') === -1) {
            // Probably TSV
            return text.split('\n').filter(l => l.trim()).map(line => line.split('\t').map(v => v.trim()));
        }
        return this.parseCSV(text);
    }
};
