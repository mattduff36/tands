// Test script to verify @react-pdf/renderer works correctly
const React = require("react");
const {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} = require("@react-pdf/renderer");

// Simple test document
const TestDocument = React.createElement(
  Document,
  {},
  React.createElement(
    Page,
    { size: "A4", style: { padding: 30 } },
    React.createElement(
      View,
      {},
      React.createElement(
        Text,
        { style: { fontSize: 20, marginBottom: 10 } },
        "PDF Generation Test",
      ),
      React.createElement(
        Text,
        { style: { fontSize: 14 } },
        "This is a test to verify @react-pdf/renderer works correctly.",
      ),
      React.createElement(
        Text,
        { style: { fontSize: 12, marginTop: 20 } },
        `Generated at: ${new Date().toISOString()}`,
      ),
    ),
  ),
);

async function testPDFGeneration() {
  try {
    console.log("Testing PDF generation...");

    const pdfBlob = await pdf(TestDocument).toBlob();
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    console.log(
      `✅ PDF generated successfully! Size: ${pdfBuffer.length} bytes`,
    );

    // Write to file for testing
    const fs = require("fs");
    const path = require("path");
    const testFilePath = path.join(__dirname, "test-output.pdf");
    fs.writeFileSync(testFilePath, pdfBuffer);
    console.log(`✅ Test PDF saved to: ${testFilePath}`);

    return true;
  } catch (error) {
    console.error("❌ PDF generation failed:", error);
    return false;
  }
}

// Run the test
testPDFGeneration().then((success) => {
  if (success) {
    console.log("✅ All PDF tests passed!");
    process.exit(0);
  } else {
    console.log("❌ PDF tests failed!");
    process.exit(1);
  }
});
