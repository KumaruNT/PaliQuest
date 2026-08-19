import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType } from 'docx';

export async function GET() {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Pali Quest - Word Import Template",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 400 }
          }),
          new Paragraph({
            text: "คำแนะนำ: กรุณากรอกข้อมูลลงในตารางด้านล่าง ห้ามลบหรือเปลี่ยนชื่อคอลัมน์ในแถวหัวตาราง (แถวแรก) โดยเด็ดขาด เนื่องจากระบบจะใช้อ่านข้อมูลตามชื่อคอลัมน์",
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            text: "1. Metadata Table",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          createMetadataTable(),
          
          new Paragraph({
            text: "2. Sentence Table",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 600, after: 200 }
          }),
          createSentenceTable(),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="PaliQuest_Import_Template.docx"',
      },
    });
  } catch (error: any) {
    console.error('Template generation error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}

function createCell(text: string, isHeader = false) {
  return new TableCell({
    children: [new Paragraph({ 
      children: [new TextRun({ text, bold: isHeader })],
      spacing: { before: 100, after: 100 }
    })]
  });
}

function createMetadataTable() {
  const fields = [
    { k: 'id', v: 'part1-gaeng-001-v2' },
    { k: 'order', v: '1' },
    { k: 'story_title', v: 'จกฺขุปาลตฺเถร' },
    { k: 'book_page_start', v: '7' },
    { k: 'book_page_end', v: '9' },
    { k: 'start_marker', v: 'สัตถา เชตวเน' },
    { k: 'end_marker', v: 'สมณธัมโม' },
  ];

  const rows = [
    new TableRow({ children: [createCell('Field', true), createCell('Value', true)] }),
    ...fields.map(f => new TableRow({ children: [createCell(f.k), createCell(f.v)] }))
  ];

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function createSentenceTable() {
  const headers = ['order', 'pali', 'translation', 'source_page', 'status'];

  const sampleRows = [
    ['1', 'เตน โข ปน สมเยน', 'ก็ โดยสมัยนั้นแล', '7', 'verified'],
    ['2', 'อายสฺมา จกฺขุปาโล', 'ท่านพระจักขุบาล', '7', 'verified'],
  ];

  const rows = [
    new TableRow({ children: headers.map(h => createCell(h, true)) }),
    ...sampleRows.map(row => 
      new TableRow({ children: row.map(text => createCell(text, false)) })
    )
  ];

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}
