const docx = require('docx');
const fs = require('fs');

async function generate() {
  const doc = new docx.Document({
    creator: "System",
    sections: [
      {
        properties: {},
        children: [
          new docx.Paragraph({ text: "Metadata Table", heading: docx.HeadingLevel.HEADING_1 }),
          new docx.Table({
            rows: [
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph("Field")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("Value")] }),
                ],
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph("id")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("part1-gaeng-999-v1")] }),
                ],
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph("order")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("999")] }),
                ],
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph("story_title")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("เรื่องทดสอบระบบ")] }),
                ],
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph("book_page_start")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("10")] }),
                ],
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph("book_page_end")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("12")] }),
                ],
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph("start_marker")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("เริ่มทดสอบ")] }),
                ],
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph("end_marker")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("จบทดสอบ")] }),
                ],
              }),
            ],
          }),
          new docx.Paragraph({ text: "Sentence Table", heading: docx.HeadingLevel.HEADING_1 }),
          new docx.Table({
            rows: [
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph("order")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("pali")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("translation")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("source_page")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("status")] }),
                ],
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph("1")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("ปฐมํ วากฺยํ ทดสอบ")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("ประโยคที่หนึ่ง ทดสอบแปล")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("10")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("verified")] }),
                ],
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph("2")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("ทุติยํ วากฺยํ")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("ประโยคที่สอง")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("draft")] }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await docx.Packer.toBuffer(doc);
  fs.writeFileSync('test-import.docx', buffer);
  console.log('test-import.docx created successfully!');
}

generate().catch(console.error);
