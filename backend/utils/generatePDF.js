const puppeteer = require("puppeteer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

module.exports = async function generatePDF(plans) {
    const templatePath = path.join(__dirname, "../templates/dietPlanTemplate.html");
    const templateHtml = fs.readFileSync(templatePath, "utf8");

    const template = handlebars.compile(templateHtml);
    const html = template({ plans });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
    });

    await browser.close();
    return pdfBuffer;
};
