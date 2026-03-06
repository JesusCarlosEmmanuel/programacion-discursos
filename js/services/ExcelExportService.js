// ExcelExportService.js

import * as XLSX from 'xlsx';

// Function to export data to Excel
const exportToExcel = (data, fileName) => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert each data set to a worksheet
    for (const [key, value] of Object.entries(data)) {
        const ws = XLSX.utils.json_to_sheet(value);
        XLSX.utils.book_append_sheet(wb, ws, key);
    }

    // Write the workbook to file
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// Example usage (exporting speakers, events, congregation, and masters)
const appData = {
    speakers: [], // Replace with actual data
    events: [],   // Replace with actual data
    congregation: [], // Replace with actual data
    masters: []   // Replace with actual data
};

exportToExcel(appData, 'AppDataExport');
