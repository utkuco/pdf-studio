
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function createTestPDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  page.drawText('PDF Studio Test File', { x: 50, y: 750, size: 24, font: helvetica });
  page.drawText('This is a test PDF to verify the Annotate tool works.', { x: 50, y: 700, size: 12, font: helvetica });
  page.drawText('Page 1', { x: 250, y: 400, size: 36, font: helvetica });
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('/Users/admin/Desktop/test_annotate.pdf', pdfBytes);
  console.log('Test PDF created: 595x842 points');
}

createTestPDF().catch(console.error);
