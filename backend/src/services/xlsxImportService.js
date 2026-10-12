// Stream XLSX rows one-by-one and resolve
// Excel shared strings and Excel date serial values.

const unzipper = require("unzipper");
const ExcelJS = require("exceljs");

const loadSharedStrings = async (filePath) => {
    const directory =
        await unzipper.Open.file(filePath);

    const sharedStringsFile =
        directory.files.find(
            (file) =>
                file.path === "xl/sharedStrings.xml"
        );

    if (!sharedStringsFile) {
        return [];
    }

    const xmlBuffer =
        await sharedStringsFile.buffer();

    const xml =
        xmlBuffer.toString("utf8");

    const sharedStrings = [];

    const matches =
        xml.match(/<si[\s\S]*?<\/si>/g) || [];

    for (const item of matches) {
        const textMatches =
            item.match(
                /<t[^>]*>([\s\S]*?)<\/t>/g
            ) || [];

        const value = textMatches
            .map((text) =>
                text
                    .replace(/<t[^>]*>/, "")
                    .replace(/<\/t>/, "")
                    .replace(/&amp;/g, "&")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .replace(/&quot;/g, '"')
                    .replace(/&apos;/g, "'")
            )
            .join("");

        sharedStrings.push(value);
    }

    return sharedStrings;
};

const excelSerialToDate = (serial) => {
    const excelEpoch =
        Date.UTC(1899, 11, 30);

    const milliseconds =
        excelEpoch +
        Number(serial) *
            24 *
            60 *
            60 *
            1000;

    return new Date(milliseconds)
        .toISOString()
        .slice(0, 10);
};

const getCellValue = (
    cell,
    sharedStrings
) => {
    const value = cell.value;

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    if (
        typeof value === "object" &&
        value.sharedString !== undefined
    ) {
        return (
            sharedStrings[value.sharedString] || ""
        );
    }

    if (value instanceof Date) {
        return value
            .toISOString()
            .slice(0, 10);
    }

    return value;
};

const readXlsxRows = async function* (filePath) {
    const sharedStrings =
        await loadSharedStrings(filePath);

    const workbookReader =
        new ExcelJS.stream.xlsx.WorkbookReader(
            filePath,
            {
                entries: "emit",
                sharedStrings: "cache",
                hyperlinks: "ignore",
                worksheets: "emit"
            }
        );

    for await (
        const worksheetReader of workbookReader
    ) {
        let headers = null;

        for await (
            const row of worksheetReader
        ) {
            if (!headers) {
                headers = [];

                for (
                    let columnIndex = 1;
                    columnIndex <= row.cellCount;
                    columnIndex++
                ) {
                    const header =
                        getCellValue(
                            row.getCell(
                                columnIndex
                            ),
                            sharedStrings
                        );

                    headers.push(
                        String(header).trim()
                    );
                }

                continue;
            }

            if (row.cellCount === 0) {
                continue;
            }

            const rowData = {};

            for (
                let columnIndex = 1;
                columnIndex <= headers.length;
                columnIndex++
            ) {
                const header =
                    headers[columnIndex - 1];

                if (!header) {
                    continue;
                }

                let value =
                    getCellValue(
                        row.getCell(
                            columnIndex
                        ),
                        sharedStrings
                    );

                if (
                    header === "next_emi_date_dom" &&
                    typeof value === "number"
                ) {
                    value =
                        excelSerialToDate(value);
                }

                rowData[header] = value;
            }

            yield rowData;
        }
    }
};

module.exports = {
    readXlsxRows
};