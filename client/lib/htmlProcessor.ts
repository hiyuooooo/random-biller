// HTML processing utilities similar to Python BeautifulSoup
export interface ProcessingConfig {
  removeExpectedVsActual: boolean;
  removeToleranceRows: boolean;
  cleanEmptyRows: boolean;
  addTableBorders: boolean;
}

export interface HeaderConfig {
  address: string;
  phone: string;
  gst: string;
  showAddress: boolean;
  showPhone: boolean;
  showGST: boolean;
}

export interface FooterConfig {
  declaration: string;
  showDeclaration: boolean;
  customNote: string;
  showCustomNote: boolean;
}

/**
 * Process HTML content similar to BeautifulSoup operations
 * Mirrors the Python code functionality for HTML manipulation
 */
export class HtmlProcessor {
  private doc: Document;

  constructor(htmlContent: string) {
    const parser = new DOMParser();
    this.doc = parser.parseFromString(htmlContent, "text/html");
  }

  /**
   * Remove "Expected vs Actual" rows from all tfoot elements
   * Similar to: for tr in footer.find_all("tr"): if "Expected vs Actual" in tr.get_text(): tr.decompose()
   */
  removeExpectedVsActualRows(): this {
    const footers = this.doc.querySelectorAll("tfoot");
    footers.forEach((footer) => {
      const rowsToRemove: Element[] = [];
      const rows = footer.querySelectorAll("tr");

      rows.forEach((tr) => {
        if (tr.textContent?.includes("Expected vs Actual")) {
          rowsToRemove.push(tr);
        }
      });

      // Remove rows (similar to tr.decompose() in BeautifulSoup)
      rowsToRemove.forEach((tr) => tr.remove());
    });

    return this;
  }

  /**
   * Remove tolerance rows from tables
   */
  removeToleranceRows(): this {
    const allRows = this.doc.querySelectorAll("tr");
    allRows.forEach((row) => {
      if (row.textContent?.includes("Tolerance:")) {
        row.remove();
      }
    });

    return this;
  }

  /**
   * Add address in header
   * Similar to: header_div.append(new_address) in BeautifulSoup
   */
  addHeaderInfo(config: HeaderConfig): this {
    const headerDiv = this.doc.querySelector(".header");
    if (!headerDiv) return this;

    // Remove existing address lines to prevent duplicates
    headerDiv
      .querySelectorAll(".address-line, .phone-line, .gst-line")
      .forEach((el) => el.remove());

    if (config.showAddress) {
      const addressP = this.doc.createElement("p");
      addressP.className = "address-line";
      addressP.style.fontSize = "14px";
      addressP.style.marginTop = "10px";
      addressP.style.color = "#666";
      addressP.textContent = config.address;
      headerDiv.appendChild(addressP); // Similar to header_div.append() in BeautifulSoup
    }

    if (config.showPhone) {
      const phoneP = this.doc.createElement("p");
      phoneP.className = "phone-line";
      phoneP.style.fontSize = "14px";
      phoneP.style.marginTop = "5px";
      phoneP.style.color = "#666";
      phoneP.textContent = `Phone: ${config.phone}`;
      headerDiv.appendChild(phoneP);
    }

    if (config.showGST) {
      const gstP = this.doc.createElement("p");
      gstP.className = "gst-line";
      gstP.style.fontSize = "14px";
      gstP.style.marginTop = "5px";
      gstP.style.color = "#666";
      gstP.textContent = `GST No: ${config.gst}`;
      headerDiv.appendChild(gstP);
    }

    return this;
  }

  /**
   * Add footer declaration
   * Similar to: soup.body.append(footer_note) in BeautifulSoup
   */
  addFooterDeclaration(config: FooterConfig): this {
    const body = this.doc.querySelector("body");
    if (!body) return this;

    // Remove existing footer notes to prevent duplicates
    body
      .querySelectorAll(".footer-declaration, .custom-footer-note")
      .forEach((el) => el.remove());

    if (config.showDeclaration) {
      const footerDiv = this.doc.createElement("div");
      footerDiv.className = "footer-declaration";
      footerDiv.style.cssText =
        "text-align:center; margin-top: 40px; font-size: 14px; font-style: italic; color: #555; border-top: 1px solid #ddd; padding-top: 20px;";
      footerDiv.textContent = config.declaration;
      body.appendChild(footerDiv); // Similar to soup.body.append() in BeautifulSoup
    }

    if (config.showCustomNote && config.customNote) {
      const customNoteDiv = this.doc.createElement("div");
      customNoteDiv.className = "custom-footer-note";
      customNoteDiv.style.cssText =
        "text-align:center; margin-top: 20px; font-size: 12px; color: #666;";
      customNoteDiv.textContent = config.customNote;
      body.appendChild(customNoteDiv);
    }

    return this;
  }

  /**
   * Clean empty rows from all tables
   */
  cleanEmptyRows(): this {
    const allRows = this.doc.querySelectorAll("tr");
    allRows.forEach((row) => {
      if (!row.textContent?.trim()) {
        row.remove();
      }
    });

    return this;
  }

  /**
   * Add table borders for better styling
   */
  addTableBorders(): this {
    const tables = this.doc.querySelectorAll("table");
    tables.forEach((table) => {
      table.style.border = "1px solid #ddd";
      table.style.borderCollapse = "collapse";

      const cells = table.querySelectorAll("td, th");
      cells.forEach((cell) => {
        const cellElement = cell as HTMLElement;
        cellElement.style.border = "1px solid #ddd";
        cellElement.style.padding = "8px";
      });
    });

    return this;
  }

  /**
   * Process with all configurations
   * Main processing function that mirrors the Python workflow
   */
  process(
    processingConfig: ProcessingConfig,
    headerConfig: HeaderConfig,
    footerConfig: FooterConfig,
  ): this {
    // Step 1: Remove Expected vs Actual rows (like the Python code)
    if (processingConfig.removeExpectedVsActual) {
      this.removeExpectedVsActualRows();
    }

    // Step 2: Remove tolerance rows if configured
    if (processingConfig.removeToleranceRows) {
      this.removeToleranceRows();
    }

    // Step 3: Add header information (like the Python code)
    this.addHeaderInfo(headerConfig);

    // Step 4: Add footer declaration (like the Python code)
    this.addFooterDeclaration(footerConfig);

    // Step 5: Clean empty rows if configured
    if (processingConfig.cleanEmptyRows) {
      this.cleanEmptyRows();
    }

    // Step 6: Add table borders if configured
    if (processingConfig.addTableBorders) {
      this.addTableBorders();
    }

    return this;
  }

  /**
   * Get the processed HTML as string
   * Similar to: str(soup) in BeautifulSoup
   */
  toHtml(): string {
    return this.doc.documentElement.outerHTML;
  }

  /**
   * Get the processed HTML with proper DOCTYPE
   */
  toFullHtml(): string {
    return `<!DOCTYPE html>\n${this.doc.documentElement.outerHTML}`;
  }

  /**
   * Static method to process HTML in one go
   * Mirrors the Python workflow exactly
   */
  static processHtml(
    htmlContent: string,
    processingConfig: ProcessingConfig,
    headerConfig: HeaderConfig,
    footerConfig: FooterConfig,
  ): string {
    return new HtmlProcessor(htmlContent)
      .process(processingConfig, headerConfig, footerConfig)
      .toFullHtml();
  }
}

/**
 * Demo function that shows the exact workflow from the Python code
 */
export function demonstratePythonWorkflow(htmlContent: string): string {
  console.log("🔴 Step 1: Remove 'Expected vs Actual' Rows");
  console.log("🟡 Step 2: Add Address in the Header");
  console.log("🟢 Step 3: Add Footer Declaration");
  console.log("💾 Step 4: Save the Final HTML");

  const processor = new HtmlProcessor(htmlContent);

  // Exact workflow from Python code
  processor
    .removeExpectedVsActualRows() // Step 1 from Python
    .addHeaderInfo({
      // Step 2 from Python
      address: "Shop No. 12, Main Bazaar, Indore, MP - 452001",
      phone: "+91 9876543210",
      gst: "23ABCDE1234F1Z5",
      showAddress: true,
      showPhone: true,
      showGST: true,
    })
    .addFooterDeclaration({
      // Step 3 from Python
      declaration: "We are under composition scheme under GST.",
      showDeclaration: true,
      customNote: "",
      showCustomNote: false,
    });

  return processor.toFullHtml(); // Step 4 from Python
}
