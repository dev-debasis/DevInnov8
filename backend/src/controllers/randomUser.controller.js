import fs from "fs";
import { format } from "fast-csv";
import { faker } from "@faker-js/faker";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateUserData = (req, res) => {
    const { count } = req.body;

    // Directory and file path for CSV file
    const tempDir = path.join(__dirname, '../../public/temp');
    const csvPath = path.join(tempDir, 'users.csv');

    // Ensure the temp directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const users = [];
    for (let i = 0; i < count; i++) {
        const gender = faker.person.sex();  // Generate gender
        const firstName = faker.person.firstName(gender);  // Generate first name based on gender
        const lastName = faker.person.lastName();  // Generate last name

        users.push({
            firstName,  // Add first name
            lastName,   // Add last name
            email: faker.internet.email(),
            gender,     // Add gender
            country: faker.location.country(),  // Add country
        });
    }

    const csvStream = fs.createWriteStream(csvPath);
    const csvFormatter = format({ headers: true });

    csvFormatter.pipe(csvStream).on('finish', () => {
        // Send the CSV file for download
        res.download(csvPath, 'users.csv', (err) => {
            if (err) {
                console.error("Error during file download: ", err);
                res.status(500).json({ message: "Failed to download CSV file", error: err.message });
            }

            // Delete the CSV file after it has been downloaded
            fs.unlinkSync(csvPath);
        });
    });

    // Write the data to CSV
    users.forEach(user => {
        csvFormatter.write(user);
    });

    csvFormatter.end();

    // Handle potential errors during CSV writing
    csvStream.on('error', (err) => {
        res.status(500).json({ message: "Failed to generate user data", error: err.message });
    });
};
