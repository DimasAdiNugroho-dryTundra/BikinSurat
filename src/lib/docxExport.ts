import JSZip from "jszip";

// Helper to escape XML special chars and remove invalid XML control characters
const escapeXml = (str: string): string => {
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

export interface DocxExportOptions {
  title?: string;
  htmlContent?: string;
  fileName?: string;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTopMm?: number;
  marginBottomMm?: number;
  marginLeftMm?: number;
  marginRightMm?: number;
  paperSize?: "A4" | "F4" | "LETTER";
  orientation?: "PORTRAIT" | "LANDSCAPE";
}

interface ImageResource {
  id: string; // rId
  filename: string;
  data: Uint8Array;
  widthEmu: number;
  heightEmu: number;
}

export async function exportToDocx(
  arg1: string | DocxExportOptions,
  arg2?: string,
  arg3?: DocxExportOptions
): Promise<void> {
  let title = "Dokumen";
  let htmlContent = "";
  let fileName = "";
  let marginTopMm = 25;
  let marginBottomMm = 20;
  let marginLeftMm = 25;
  let marginRightMm = 20;
  let paperSize: "A4" | "F4" | "LETTER" = "A4";
  let orientation: "PORTRAIT" | "LANDSCAPE" = "PORTRAIT";

  if (typeof arg1 === "string") {
    if (arg1.includes("<") || (arg2 && arg2.endsWith(".docx"))) {
      htmlContent = arg1;
      fileName = arg2 || "";
      if (arg3) {
        title = arg3.title || "Dokumen";
        marginTopMm = arg3.marginTop ?? arg3.marginTopMm ?? 25;
        marginBottomMm = arg3.marginBottom ?? arg3.marginBottomMm ?? 20;
        marginLeftMm = arg3.marginLeft ?? arg3.marginLeftMm ?? 25;
        marginRightMm = arg3.marginRight ?? arg3.marginRightMm ?? 20;
        if (arg3.paperSize) paperSize = arg3.paperSize;
        if (arg3.orientation) orientation = arg3.orientation;
      }
    } else {
      title = arg1;
      htmlContent = arg2 || "";
      if (arg3) {
        fileName = arg3.fileName || "";
        marginTopMm = arg3.marginTop ?? arg3.marginTopMm ?? 25;
        marginBottomMm = arg3.marginBottom ?? arg3.marginBottomMm ?? 20;
        marginLeftMm = arg3.marginLeft ?? arg3.marginLeftMm ?? 25;
        marginRightMm = arg3.marginRight ?? arg3.marginRightMm ?? 20;
        if (arg3.paperSize) paperSize = arg3.paperSize;
        if (arg3.orientation) orientation = arg3.orientation;
      }
    }
  } else {
    title = arg1.title || "Dokumen";
    htmlContent = arg1.htmlContent || "";
    fileName = arg1.fileName || "";
    marginTopMm = arg1.marginTop ?? arg1.marginTopMm ?? 25;
    marginBottomMm = arg1.marginBottom ?? arg1.marginBottomMm ?? 20;
    marginLeftMm = arg1.marginLeft ?? arg1.marginLeftMm ?? 25;
    marginRightMm = arg1.marginRight ?? arg1.marginRightMm ?? 20;
    if (arg1.paperSize) paperSize = arg1.paperSize;
    if (arg1.orientation) orientation = arg1.orientation;
  }

  if (!fileName) {
    const safeTitle = title.length > 50 ? "Dokumen_Surat" : title.replace(/[^a-zA-Z0-9_-]/g, "_");
    fileName = `${safeTitle}.docx`;
  }

  const zip = new JSZip();

  // Convert mm to twips (1 mm = 56.7 twips)
  const topTwips = Math.round(marginTopMm * 56.7);
  const bottomTwips = Math.round(marginBottomMm * 56.7);
  const leftTwips = Math.round(marginLeftMm * 56.7);
  const rightTwips = Math.round(marginRightMm * 56.7);

  // Available page content width in twips (A4 width = 11906 twips)
  const contentWidthTwips = Math.max(4000, 11906 - leftTwips - rightTwips);

  // Collect image media for docx
  const imageResources: ImageResource[] = [];
  let imageCounter = 0;

  // Process data URI images
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${htmlContent}</div>`, "text/html");
  const body = doc.body.firstElementChild || doc.body;

  // Extract images and create relationships
  const imgElements = body.querySelectorAll("img");
  imgElements.forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (src.startsWith("data:image/")) {
      try {
        const parts = src.split(";base64,");
        const mime = parts[0].replace("data:", "");
        const base64Data = parts[1];
        if (base64Data) {
          const ext = mime.includes("jpeg") || mime.includes("jpg") ? "jpeg" : "png";
          imageCounter++;
          const rId = `rIdImg${imageCounter}`;
          const filename = `image${imageCounter}.${ext}`;

          // Convert base64 to binary
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }

          // Default dimensions: 1px = 9525 EMU
          let widthPx = parseInt(img.getAttribute("width") || "", 10) || img.clientWidth || 240;
          let heightPx = parseInt(img.getAttribute("height") || "", 10) || img.clientHeight || 120;
          if (widthPx > 600) {
            const ratio = 600 / widthPx;
            widthPx = 600;
            heightPx = Math.round(heightPx * ratio);
          }

          const widthEmu = Math.round(widthPx * 9525);
          const heightEmu = Math.round(heightPx * 9525);

          imageResources.push({
            id: rId,
            filename,
            data: bytes,
            widthEmu,
            heightEmu,
          });

          // Tag element with resource id
          img.setAttribute("data-docx-rid", rId);
        }
      } catch (err) {
        console.error("Gagal memproses gambar untuk docx:", err);
      }
    }
  });

  // Convert HTML DOM to WordprocessingML
  const htmlToWordXml = (root: Element): string => {
    let xml = "";

    interface InlineStyle {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
      size?: string;
      fontFamily?: string;
      color?: string;
    }

    const processInline = (
      node: Node,
      inheritStyle: InlineStyle = {}
    ): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (!text) return "";

        let rPr = "";
        if (inheritStyle.fontFamily) {
          rPr += `<w:rFonts w:ascii="${escapeXml(inheritStyle.fontFamily)}" w:hAnsi="${escapeXml(inheritStyle.fontFamily)}" w:cs="${escapeXml(inheritStyle.fontFamily)}"/>`;
        }
        if (inheritStyle.bold) rPr += "<w:b/>";
        if (inheritStyle.italic) rPr += "<w:i/>";
        if (inheritStyle.underline) rPr += '<w:u w:val="single"/>';
        if (inheritStyle.size) rPr += `<w:sz w:val="${inheritStyle.size}"/>`;
        if (inheritStyle.strikethrough) rPr += "<w:strike/>";
        if (inheritStyle.size) rPr += `<w:sz w:val="${inheritStyle.size}"/><w:szCs w:val="${inheritStyle.size}"/>`;
        if (inheritStyle.color) rPr += `<w:color w:val="${inheritStyle.color}"/>`;

        return `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ""}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return "";

      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === "br") {
        return "<w:r><w:br/></w:r>";
      }

      if (tag === "img") {
        const rId = el.getAttribute("data-docx-rid");
        const res = imageResources.find((img) => img.id === rId);
        if (res) {
          return `<w:r>
            <w:drawing>
              <wp:inline distT="0" distB="0" distL="0" distR="0">
                <wp:extent cx="${res.widthEmu}" cy="${res.heightEmu}"/>
                <wp:effectExtent l="0" t="0" r="0" b="0"/>
                <wp:docPr id="${imageCounter}" name="${res.filename}"/>
                <wp:cNvGraphicFramePr>
                  <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
                </wp:cNvGraphicFramePr>
                <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                      <pic:nvPicPr>
                        <pic:cNvPr id="${imageCounter}" name="${res.filename}"/>
                        <pic:cNvPicPr/>
                      </pic:nvPicPr>
                      <pic:blipFill>
                        <a:blip r:embed="${res.id}"/>
                        <a:stretch>
                          <a:fillRect/>
                        </a:stretch>
                      </pic:blipFill>
                      <pic:spPr>
                        <a:xfrm>
                          <a:off x="0" y="0"/>
                          <a:ext cx="${res.widthEmu}" cy="${res.heightEmu}"/>
                        </a:xfrm>
                        <a:prstGeom prst="rect">
                          <a:avLst/>
                        </a:prstGeom>
                      </pic:spPr>
                    </pic:pic>
                  </a:graphicData>
                </a:graphic>
              </wp:inline>
            </w:drawing>
          </w:r>`;
        }
        return "";
      }

      const style: InlineStyle = { ...inheritStyle };
      if (tag === "strong" || tag === "b") style.bold = true;
      if (tag === "em" || tag === "i") style.italic = true;
      if (tag === "u") style.underline = true;
      if (tag === "s" || tag === "strike" || tag === "del") style.strikethrough = true;
      if (el.style.textDecoration?.includes("line-through")) style.strikethrough = true;
      if (el.style.textDecoration?.includes("underline")) style.underline = true;
      if (el.style.fontWeight === "bold" || parseInt(el.style.fontWeight, 10) >= 600) style.bold = true;
      if (el.style.fontStyle === "italic") style.italic = true;
      if (el.style.textDecoration?.includes("underline")) style.underline = true;

      // Font size extraction
      if (el.style.fontSize) {
        const fs = el.style.fontSize.trim().toLowerCase();
        if (fs.endsWith("pt")) {
          const pt = parseFloat(fs);
          if (!isNaN(pt)) style.size = String(Math.round(pt * 2));
        } else if (fs.endsWith("px")) {
          const px = parseFloat(fs);
          if (!isNaN(px)) style.size = String(Math.round(px * 1.5));
        }
      }
      if (tag === "font") {
        const fontSz = el.getAttribute("size");
        if (fontSz) {
          const szMap: { [k: string]: string } = {
            "1": "20",
            "2": "22",
            "3": "24",
            "4": "28",
            "5": "36",
            "6": "48",
            "7": "72",
          };
          if (szMap[fontSz]) style.size = szMap[fontSz];
        }
        const face = el.getAttribute("face");
        if (face) style.fontFamily = face;
        const color = el.getAttribute("color");
        if (color) {
          const hex = color.replace("#", "").trim();
          if (hex.length === 6) style.color = hex;
        }
      }

      if (el.style.fontFamily) {
        const cleanFont = el.style.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
        if (cleanFont) style.fontFamily = cleanFont;
      }

      if (el.style.color) {
        const c = el.style.color.trim();
        if (c.startsWith("#")) {
          const hex = c.replace("#", "").trim();
          if (hex.length === 6) style.color = hex;
        } else if (c.startsWith("rgb")) {
          const nums = c.match(/\d+/g);
          if (nums && nums.length >= 3) {
            const r = parseInt(nums[0], 10).toString(16).padStart(2, "0");
            const g = parseInt(nums[1], 10).toString(16).padStart(2, "0");
            const b = parseInt(nums[2], 10).toString(16).padStart(2, "0");
            style.color = `${r}${g}${b}`;
          }
        }
      }

      let res = "";
      el.childNodes.forEach((c) => (res += processInline(c, style)));
      return res;
    };

    const processBlock = (
      node: Node,
      inheritBlock: { align?: string; isRightBlock?: boolean; underline?: boolean } = {}
    ): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent || "").trim();
        if (!text) return "";
        return `<w:p><w:pPr><w:spacing w:after="120" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return "";

      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // Resolve alignment from current element or inherited from parent
      let align = inheritBlock.align || "";
      if (el.style.textAlign) {
        align = el.style.textAlign;
      } else if (el.getAttribute("align")) {
        align = el.getAttribute("align") || "";
      }

      // Check if this element or its parent is floated to the right (like signature block)
      const isFloatRight = el.style.float === "right" || el.style.marginLeft === "auto";
      const isRightBlock = inheritBlock.isRightBlock || isFloatRight;
      const isUnderline = inheritBlock.underline || el.style.textDecoration?.includes("underline") || false;

      // Table parsing with intelligent column width calculation
      if (tag === "table") {
        const rows = Array.from(el.querySelectorAll("tr"));
        if (rows.length === 0) return "";

        // Determine maximum column count
        let maxCols = 1;
        rows.forEach((tr) => {
          const cells = tr.querySelectorAll("td, th");
          if (cells.length > maxCols) maxCols = cells.length;
        });

        // Detect column widths from the first row if available
        const firstRowCells = Array.from(rows[0].querySelectorAll("td, th"));
        const colWidthsTwips: number[] = [];
        let explicitWidthSum = 0;
        let unassignedCols = 0;

        for (let i = 0; i < maxCols; i++) {
          const cell = firstRowCells[i] as HTMLElement | undefined;
          let cellW = 0;
          if (cell) {
            const wAttr = cell.getAttribute("width");
            const wStyle = cell.style.width;
            if (wStyle && wStyle.endsWith("px")) {
              cellW = Math.round(parseInt(wStyle, 10) * 15);
            } else if (wStyle && wStyle.endsWith("%")) {
              cellW = Math.round((parseInt(wStyle, 10) / 100) * contentWidthTwips);
            } else if (wAttr) {
              const num = parseInt(wAttr, 10);
              if (num > 0) cellW = Math.round(num * 15);
            }
          }

          if (cellW > 0) {
            colWidthsTwips.push(cellW);
            explicitWidthSum += cellW;
          } else {
            colWidthsTwips.push(0);
            unassignedCols++;
          }
        }

        // Fill unassigned columns with remaining width
        const remainingWidth = Math.max(500, contentWidthTwips - explicitWidthSum);
        const defaultColWidth = unassignedCols > 0 ? Math.floor(remainingWidth / unassignedCols) : Math.floor(contentWidthTwips / maxCols);

        for (let i = 0; i < maxCols; i++) {
          if (colWidthsTwips[i] === 0) {
            colWidthsTwips[i] = defaultColWidth;
          }
        }

        let tblGridXml = "<w:tblGrid>";
        for (let i = 0; i < maxCols; i++) {
          tblGridXml += `<w:gridCol w:w="${colWidthsTwips[i]}"/>`;
        }
        tblGridXml += "</w:tblGrid>";

        // Determine table borders
        const hasBorder =
          el.style.border || el.getAttribute("border") || el.className.includes("border");
        const borderVal = hasBorder ? "single" : "none";
        const borderSz = hasBorder ? ' w:sz="4" w:space="0" w:color="CCCCCC"' : "";

        // Check table margin-left (e.g. margin-left: 20px)
        let tblIndXml = "";
        if (el.style.marginLeft) {
          const ml = parseInt(el.style.marginLeft, 10);
          if (ml > 0) {
            const indTwips = Math.round(ml * 15);
            tblIndXml = `<w:tblInd w:w="${indTwips}" w:type="dxa"/>`;
          }
        }

        let tblPrXml = `<w:tblPr>
          <w:tblW w:w="${contentWidthTwips}" w:type="dxa"/>
          ${tblIndXml}
          <w:tblBorders>
            <w:top w:val="${borderVal}"${borderSz}/>
            <w:left w:val="${borderVal}"${borderSz}/>
            <w:bottom w:val="${borderVal}"${borderSz}/>
            <w:right w:val="${borderVal}"${borderSz}/>
            <w:insideH w:val="${borderVal}"${borderSz}/>
            <w:insideV w:val="${borderVal}"${borderSz}/>
          </w:tblBorders>
          <w:tblCellMar>
            <w:top w:w="80" w:type="dxa"/>
            <w:bottom w:w="80" w:type="dxa"/>
            <w:left w:w="120" w:type="dxa"/>
            <w:right w:w="120" w:type="dxa"/>
          </w:tblCellMar>
        </w:tblPr>`;

        let rowsXml = "";
        rows.forEach((tr) => {
          let trXml = "<w:tr>";
          const cells = Array.from(tr.querySelectorAll("td, th"));

          cells.forEach((td, cellIdx) => {
            const tdEl = td as HTMLElement;
            const width = colWidthsTwips[cellIdx] || defaultColWidth;

            let cellInner = "";
            tdEl.childNodes.forEach((child) => {
              cellInner += processInline(child);
            });

            // If empty cell, ensure at least an empty paragraph
            const cellPara = cellInner
              ? `<w:p><w:pPr><w:spacing w:before="30" w:after="30" w:line="240" w:lineRule="auto"/></w:pPr>${cellInner}</w:p>`
              : '<w:p><w:pPr><w:spacing w:before="30" w:after="30" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:t></w:t></w:r></w:p>';

            trXml += `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/></w:tcPr>${cellPara}</w:tc>`;
          });

          trXml += "</w:tr>";
          rowsXml += trXml;
        });

        return `<w:tbl>${tblPrXml}${tblGridXml}${rowsXml}</w:tbl>`;
      }

      // If div/section contains block children (like table or headings or p), recurse children with inherited context
      const hasBlockChildren = el.querySelector("table, h1, h2, h3, p, div, hr, ul, ol");
      if (hasBlockChildren) {
        let blockXml = "";
        el.childNodes.forEach((c) => {
          blockXml += processBlock(c, {
            align,
            isRightBlock,
            underline: isUnderline,
          });
        });
        return blockXml;
      }

      // Spacing / Margins calculation
      let beforeTwips = 40;
      let afterTwips = 80;

      if (el.style.marginTop) {
        const mt = parseInt(el.style.marginTop, 10);
        beforeTwips = Math.max(0, Math.round(mt * 15));
      }
      if (el.style.marginBottom) {
        const mb = parseInt(el.style.marginBottom, 10);
        afterTwips = Math.max(0, Math.round(mb * 15));
      }
      if (el.style.margin) {
        const m = el.style.margin.trim();
        if (m === "0" || m === "0px") {
          beforeTwips = 0;
          afterTwips = 0;
        } else {
          const parts = m.split(/\s+/).map((p) => parseInt(p, 10) || 0);
          if (parts.length === 1) {
            beforeTwips = Math.round(parts[0] * 15);
            afterTwips = beforeTwips;
          } else if (parts.length === 2) {
            beforeTwips = Math.round(parts[0] * 15);
            afterTwips = beforeTwips;
          } else if (parts.length >= 3) {
            beforeTwips = Math.round(parts[0] * 15);
            afterTwips = Math.round(parts[2] * 15);
          }
        }
      }

      // Heading parsing
      if (tag === "h1" || tag === "h2" || tag === "h3") {
        const isCenter = align === "center" || el.style.textAlign === "center" || el.getAttribute("align") === "center";
        const isRight = align === "right" || el.style.textAlign === "right" || el.getAttribute("align") === "right";
        const size = tag === "h1" ? "32" : tag === "h2" ? "28" : "24";

        let jc = "";
        if (isCenter) jc = '<w:jc w:val="center"/>';
        else if (isRight) jc = '<w:jc w:val="right"/>';

        let inner = "";
        el.childNodes.forEach((c) => (inner += processInline(c, { bold: true, size, underline: isUnderline })));

        return `<w:p><w:pPr><w:spacing w:before="240" w:after="120"/>${jc}</w:pPr>${inner || "<w:r><w:t></w:t></w:r>"}</w:p>`;
        return `<w:p><w:pPr><w:spacing w:before="${beforeTwips}" w:after="${afterTwips}"/>${jc}</w:pPr>${inner || "<w:r><w:t></w:t></w:r>"}</w:p>`;
      }

      // Horizontal Line
      if (tag === "hr") {
        return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="000000"/></w:pBdr><w:spacing w:before="120" w:after="120"/></w:pPr><w:r><w:t></w:t></w:r></w:p>';
      }

      // Paragraph, Div, Blockquote, or List Item
      if (tag === "p" || tag === "div" || tag === "blockquote" || tag === "li") {
        const isCenter = align === "center" || el.style.textAlign === "center" || el.getAttribute("align") === "center";
        const isRight = align === "right" || el.style.textAlign === "right" || el.getAttribute("align") === "right";
        const isJustify = align === "justify" || el.style.textAlign === "justify";

        let jc = "";
        if (isCenter && !isRightBlock) jc = '<w:jc w:val="center"/>';
        else if (isRight && !isRightBlock) jc = '<w:jc w:val="right"/>';
        else if (isJustify) jc = '<w:jc w:val="both"/>';

        // If this paragraph belongs to a right-aligned block (signature block)
        // Set left indent to 5400 twips (~9.5cm) so it renders on the right side of the page
        // Set left indent dynamically leaving ~4400 twips width so date lines never wrap
        let indXml = "";
        if (isRightBlock) {
          indXml = '<w:ind w:left="5400"/>';
          const rightIndent = Math.max(2800, contentWidthTwips - 4400);
          indXml = `<w:ind w:left="${rightIndent}"/>`;
          if (isCenter) {
            jc = '<w:jc w:val="center"/>';
          }
        }

        let runs = "";
        el.childNodes.forEach((c) => (runs += processInline(c, { underline: isUnderline })));

        // Spacing: spacing must precede ind, ind must precede jc
        return `<w:p><w:pPr><w:spacing w:before="${beforeTwips}" w:after="${afterTwips}" w:line="240" w:lineRule="auto"/>${indXml}${jc}</w:pPr>${runs || "<w:r><w:t></w:t></w:r>"}</w:p>`;
      }

      // Lists
      if (tag === "ul" || tag === "ol") {
        let listXml = "";
        const items = el.querySelectorAll("li");
        items.forEach((li) => {
          let itemText = "";
          li.childNodes.forEach((c) => (itemText += processInline(c)));
          listXml += `<w:p><w:pPr><w:spacing w:before="40" w:after="40"/><w:ind w:left="720"/></w:pPr><w:r><w:t xml:space="preserve">• </w:t></w:r>${itemText}</w:p>`;
        });
        return listXml;
      }

      // Fallback
      let fallback = "";
      el.childNodes.forEach((c) => (fallback += processBlock(c, inheritBlock)));
      return fallback;
    };

    root.childNodes.forEach((n) => {
      xml += processBlock(n);
    });

    return xml;
  };

  // 1. [Content_Types].xml
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="gif" ContentType="image/gif"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // 3. word/_rels/document.xml.rels
  let docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>`;

  imageResources.forEach((img) => {
    docRelsXml += `\n  <Relationship Id="${img.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${img.filename}"/>`;
    zip.file(`word/media/${img.filename}`, img.data);
  });
  docRelsXml += `\n</Relationships>`;
  zip.file("word/_rels/document.xml.rels", docRelsXml);

  // 4. word/settings.xml
  zip.file(
    "word/settings.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>`
  );

  // 5. word/styles.xml (Complete with Word standard Normal style)
  zip.file(
    "word/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:lang w:val="id-ID"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="120" w:line="240" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="table" w:default="1" w:styleId="TableNormal">
    <w:name w:val="Normal Table"/>
    <w:tblPr>
      <w:tblInd w:w="0" w:type="dxa"/>
      <w:tblCellMar>
        <w:top w:w="0" w:type="dxa"/>
        <w:left w:w="108" w:type="dxa"/>
        <w:bottom w:w="0" w:type="dxa"/>
        <w:right w:w="108" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
  </w:style>
</w:styles>`
  );

  // 6. word/document.xml
  const bodyXml = htmlToWordXml(body);

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:w10="urn:schemas-microsoft-com:office:word"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${bodyXml || "<w:p><w:r><w:t></w:t></w:r></w:p>"}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgSz w:w="${orientation === 'LANDSCAPE' ? (paperSize === 'F4' ? 18710 : paperSize === 'LETTER' ? 15818 : 16838) : (paperSize === 'F4' ? 12190 : paperSize === 'LETTER' ? 12240 : 11906)}" w:h="${orientation === 'LANDSCAPE' ? (paperSize === 'F4' ? 12190 : paperSize === 'LETTER' ? 12240 : 11906) : (paperSize === 'F4' ? 18710 : paperSize === 'LETTER' ? 15818 : 16838)}"${orientation === 'LANDSCAPE' ? ' w:orient="landscape"' : ''}/>
      <w:pgMar w:top="${topTwips}" w:right="${rightTwips}" w:bottom="${bottomTwips}" w:left="${leftTwips}"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file("word/document.xml", documentXml);

  // Generate Blob and trigger download
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".docx") ? fileName : `${fileName}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
