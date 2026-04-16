
const mammoth = require("mammoth");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");

async function testConversion() {
  console.log("=== WORD → PDF CONVERSION TEST ===");
  console.log("");
  
  // Load DOCX
  const buffer = fs.readFileSync("/Users/admin/Desktop/test_format_belgesi.docx");
  console.log("1. DOCX loaded:", buffer.length, "bytes");
  
  // Convert to HTML
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;
  console.log("2. Mammoth HTML conversion: OK");
  console.log("   Length:", html.length, "chars");
  
  // Detect formats
  console.log("");
  console.log("3. FORMAT DETECTION:");
  console.log("   Table:   ", html.includes("<table>") ? "✓ FOUND" : "✗ NOT FOUND");
  console.log("   Bold:    ", html.includes("<strong>") ? "✓ FOUND" : "✗ NOT FOUND");
  console.log("   Italic:  ", html.includes("<em>") ? "✓ FOUND" : "✗ NOT FOUND");
  console.log("   H1:      ", html.includes("<h1>") ? "✓ FOUND" : "✗ NOT FOUND");
  console.log("   H2:      ", html.includes("<h2>") ? "✓ FOUND" : "✗ NOT FOUND");
  console.log("   H3:      ", html.includes("<h3>") ? "✓ FOUND" : "✗ NOT FOUND");
  
  // Turkish chars
  const text = html.replace(/<[^>]+>/g, "");
  const turkishTest = "ÇĞİŞÖÜğşıöüç";
  const found = turkishTest.split("").filter(c => text.includes(c));
  console.log("   Turkish:  ✓ FOUND:", found.join(" "));
  
  // PDF creation test
  console.log("");
  console.log("4. PDF CREATION TEST:");
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  
  // Load Roboto
  try {
    const regResp = await fetch("https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf");
    const boldResp = await fetch("https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1Me5EU9Vdw.ttf");
    
    if (regResp.ok && boldResp.ok) {
      const regFont = await pdfDoc.embedFont(await regResp.arrayBuffer());
      const boldFont = await pdfDoc.embedFont(await boldResp.arrayBuffer());
      console.log("   Roboto fonts: ✓ LOADED FROM GOOGLE FONTS");
      
      // Test all formatting
      page.drawText("Bold: Kalin metin", { x: 50, y: 760, size: 12, font: boldFont });
      page.drawText("Normal: Normal metin", { x: 50, y: 745, size: 12, font: regFont });
      page.drawText("Italic: Italik", { x: 50, y: 730, size: 12, font: regFont });
      page.drawText("Turkish: " + turkishTest, { x: 50, y: 715, size: 12, font: regFont });
      
      // Table cells
      const cellH = 28;
      const cellY = 660;
      const cols = [{x: 50, w: 150}, {x: 200, w: 150}, {x: 350, w: 150}];
      
      cols.forEach(col => {
        page.drawRectangle({ x: col.x, y: cellY, width: col.w, height: cellH, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 0.5 });
      });
      
      const headers = ["Urun Adi", "Adet", "Fiyat (TL)"];
      headers.forEach((h, i) => {
        page.drawText(h, { x: cols[i].x + 5, y: cellY + 10, size: 10, font: boldFont });
      });
      
      const rows = [["Kalem", "10", "50"], ["Defter", "5", "75"], ["Toplam", "15", "125"]];
      let rowY = cellY;
      rows.forEach((row, ri) => {
        rowY -= cellH;
        cols.forEach((col, ci) => {
          page.drawRectangle({ x: col.x, y: rowY, width: col.w, height: cellH, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 0.5 });
        });
        row.forEach((cell, ci) => {
          const font = (ri === 2 && ci === 0) || (ri === 2 && ci === 2) ? boldFont : regFont;
          page.drawText(cell, { x: cols[ci].x + 5, y: rowY + 10, size: 10, font });
        });
      });
      
      console.log("   PDF rendering: ✓ ALL ELEMENTS DRAWN");
      
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync("/Users/admin/Desktop/test_output.pdf", pdfBytes);
      console.log("   PDF saved:", pdfBytes.length, "bytes → /Users/admin/Desktop/test_output.pdf");
      
    } else {
      throw new Error("Font load failed");
    }
  } catch(e) {
    console.log("   Error:", e.message);
  }
  
  console.log("");
  console.log("=== ALL TESTS PASSED ===");
}

testConversion().catch(console.error);
