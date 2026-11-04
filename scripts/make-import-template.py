"""Build the AUSPHARMA product / batch import template (openpyxl)."""
import sys
from datetime import date

from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT = sys.argv[1] if len(sys.argv) > 1 else "docs/templates/AUSPHARMA_Product_Import_Template.xlsx"
LAST = 501  # data rows 3..501 (500 rows); row 2 = example

FONT = "Arial"
TEAL, MINT, INPUT, EXAMPLE_FILL, CALC_FILL = "087F75", "DFF6EF", "FFF2CC", "EDEDED", "F3F8F6"
thin = Side(style="thin", color="C9D3D2")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

H_FONT = Font(name=FONT, bold=True, color="FFFFFF", size=10)
H_FILL = PatternFill("solid", fgColor=TEAL)
CALC_H_FILL = PatternFill("solid", fgColor="586D6B")
BODY = Font(name=FONT, size=10)
EX_FONT = Font(name=FONT, size=10, italic=True, color="595959")
DATE_FMT = "DD-MM-YYYY"

wb = Workbook()


def header(ws, cols):
    """cols: list of (title, width, kind, note) where kind in input|calc."""
    for i, (title, width, kind, note) in enumerate(cols, start=1):
        c = ws.cell(row=1, column=i, value=title)
        c.font = H_FONT
        c.fill = CALC_H_FILL if kind == "calc" else H_FILL
        c.alignment = Alignment(wrap_text=True, vertical="center")
        c.border = BORDER
        if note:
            c.comment = Comment(note, "AUSPHARMA")
        ws.column_dimensions[get_column_letter(i)].width = width
    ws.row_dimensions[1].height = 42
    ws.freeze_panes = "B3"


def style_rows(ws, cols):
    for i, (_, _, kind, _) in enumerate(cols, start=1):
        ex = ws.cell(row=2, column=i)
        ex.font, ex.fill, ex.border = EX_FONT, PatternFill("solid", fgColor=EXAMPLE_FILL), BORDER
        for r in range(3, LAST + 1):
            c = ws.cell(row=r, column=i)
            c.font, c.border = BODY, BORDER
            c.fill = PatternFill("solid", fgColor=CALC_FILL if kind == "calc" else INPUT)


def text_cols(ws, letters):
    for L in letters:
        for r in range(2, LAST + 1):
            ws[f"{L}{r}"].number_format = "@"


def date_cols(ws, letters):
    for L in letters:
        for r in range(2, LAST + 1):
            ws[f"{L}{r}"].number_format = DATE_FMT


def add_list(ws, sqref, formula, title, msg):
    dv = DataValidation(type="list", formula1=formula, allow_blank=True,
                        showErrorMessage=True, errorTitle=title, error=msg)
    ws.add_data_validation(dv)
    dv.add(sqref)


# ---------------------------------------------------------------- Lists
lists = wb.active
lists.title = "Lists"
LISTS = {
    "A": ("Dosage form", ["Tablet", "Film-coated tablet", "Chewable tablet", "Dispersible tablet",
                          "Capsule", "Soft gelatin capsule", "Oral suspension", "Syrup",
                          "Oral drops", "Injection", "Cream", "Ointment", "Gel", "Eye drops",
                          "Ear drops", "Nasal spray", "Inhaler", "Powder for suspension", "Other"]),
    "B": ("Schedule", ["H", "H1", "X", "G", "OTC (non-scheduled)"]),
    "C": ("Therapy area", ["Cardiology", "Diabetes", "Anti-infectives",
                           "Pain, fever & inflammation", "Respiratory & anti-allergy",
                           "Gastro", "CNS / Neuro", "Other"]),
    "D": ("Pack type", ["Blister strip", "Alu-alu strip", "Bottle", "Tube", "Vial",
                        "Ampoule", "Carton", "Sachet", "Other"]),
    "E": ("MRP per", ["Pack", "Strip", "Bottle", "Unit"]),
}
for col, (title, values) in LISTS.items():
    lists[f"{col}1"] = title
    lists[f"{col}1"].font, lists[f"{col}1"].fill = H_FONT, H_FILL
    lists.column_dimensions[col].width = 28
    for i, v in enumerate(values, start=2):
        lists[f"{col}{i}"] = v
        lists[f"{col}{i}"].font = BODY
lists["G1"] = "These lists feed the dropdowns. Ask the website team before changing them."
lists["G1"].font = Font(name=FONT, italic=True, size=9, color="595959")
RNG = {k: f"Lists!${k}$2:${k}${len(v[1]) + 1}" for k, v in LISTS.items()}

# ---------------------------------------------------------------- Manufacturers
mf = wb.create_sheet("Manufacturers", 0)
MF_COLS = [
    ("Manufacturer ID", 16, "input", "Short code you choose, e.g. MFR-001. Used on the Products sheet."),
    ("Manufacturer legal name", 32, "input", "Exactly as on the manufacturing licence."),
    ("Address (building, street, area)", 36, "input", None),
    ("City", 16, "input", None),
    ("State", 16, "input", None),
    ("PIN code", 10, "input", "6 digits."),
    ("Manufacturing licence no(s).", 24, "input", "If several, separate with ; "),
    ("WHO-GMP certificate no.", 22, "input", None),
    ("Issuing authority", 24, "input", "e.g. the State Drugs Control authority that issued the WHO-GMP certificate."),
    ("WHO-GMP valid until", 14, "input", "Date format DD-MM-YYYY."),
    ("WHO-GMP certificate PDF file name", 30, "input", "Name of the PDF you will upload, e.g. MFR-001_WHO-GMP.pdf"),
    ("Certificate status (auto)", 20, "calc", "Calculated. Do not type here."),
]
header(mf, MF_COLS)
style_rows(mf, MF_COLS)
text_cols(mf, ["A", "F", "G", "H", "K"])
date_cols(mf, ["J"])
mf.append([])  # no-op; rows filled below
ex = ["EXAMPLE-MFR", "EXAMPLE Pharmaceuticals Pvt Ltd", "Plot 00, Example Industrial Area",
      "Hyderabad", "Telangana", "500000", "EX/0000/0000", "EX-WHO-GMP-0000",
      "Example State Drugs Control Administration", date(2027, 12, 31),
      "EXAMPLE-MFR_WHO-GMP.pdf"]
for i, v in enumerate(ex, start=1):
    mf.cell(row=2, column=i, value=v)
for r in range(2, LAST + 1):
    mf[f"L{r}"] = (f'=IF(J{r}="","",IF(J{r}<TODAY(),"✗ Expired",'
                   f'IF(J{r}-TODAY()<=60,"⚠ Expires within 60 days","✓ Valid")))')
dv = DataValidation(type="custom", formula1="AND(LEN(F3)=6,ISNUMBER(--F3))", allow_blank=True,
                    showErrorMessage=True, errorTitle="PIN code", error="PIN code must be 6 digits.")
mf.add_data_validation(dv)
dv.add(f"F3:F{LAST}")
dv = DataValidation(type="date", operator="greaterThan", formula1="DATE(2000,1,1)", allow_blank=True,
                    showErrorMessage=True, errorTitle="Date", error="Enter a date (DD-MM-YYYY).")
mf.add_data_validation(dv)
dv.add(f"J3:J{LAST}")

# ---------------------------------------------------------------- Products
pr = wb.create_sheet("Products", 1)
PR_COLS = [
    ("GTIN-13", 16, "input", "13-digit GS1 barcode number printed on the pack, e.g. 8906219880070. "
                             "The column is formatted as text so leading digits are kept."),
    ("GTIN check (auto)", 20, "calc", "Calculated: checks length and the GS1 check digit."),
    ("Brand name", 24, "input", "As printed on the pack, e.g. Telmisartan 40 mg Tablet / brand name."),
    ("Composition (generic name + strength)", 34, "input",
     "Exactly as on the label, e.g. Each film-coated tablet contains: Telmisartan IP 40 mg."),
    ("Dosage form", 18, "input", "Choose from the list."),
    ("Pack size", 12, "input", "e.g. 10's, 15's, 100 ml"),
    ("Pack type", 16, "input", "Choose from the list."),
    ("Schedule", 12, "input", "Drug schedule as on the label. Choose from the list."),
    ("Therapy area", 22, "input", "Choose from the list (matches the pack colour guide)."),
    ("Manufacturer ID", 16, "input", "Choose an ID from the Manufacturers sheet."),
    ("Manufacturer name (auto)", 28, "calc", "Calculated from Manufacturer ID."),
    ("Manufacturing licence no. for this product", 24, "input",
     "As printed on the label (M.L. No.)."),
    ("Marketed by", 26, "input", "Default: Auspharma Private Limited."),
    ("MRP (₹)", 10, "input", "Inclusive of all taxes, as printed on the pack."),
    ("MRP per", 10, "input", "Choose from the list."),
    ("Storage condition", 26, "input", "As on the label, e.g. Store below 30°C. Protect from light and moisture."),
    ("Shelf life (months)", 10, "input", None),
    ("PIL / package insert PDF file name", 30, "input",
     "Name of the approved leaflet PDF you will upload. Suggested: {GTIN}_PIL.pdf"),
    ("PIL version / date of revision", 18, "input", "As printed on the leaflet, e.g. v2 / 03-2026."),
    ("Pack photo file name", 26, "input", "Optional. Suggested: {GTIN}.jpg"),
    ("Notes for website team", 30, "input", None),
]
header(pr, PR_COLS)
style_rows(pr, PR_COLS)
text_cols(pr, ["A", "F", "J", "L", "R", "S", "T"])
ex = ["8900000000005", None, "EXAMPLE Telmisartan 40 mg Tablet",
      "Each film-coated tablet contains: Telmisartan IP 40 mg", "Film-coated tablet", "10's",
      "Blister strip", "H", "Cardiology", "EXAMPLE-MFR", None, "EX/0000/0000",
      "Auspharma Private Limited", 99.0, "Strip",
      "Store below 30°C. Protect from light and moisture.", 24,
      "8900000000005_PIL.pdf", "v1 / 01-2026", "8900000000005.jpg",
      "EXAMPLE row: the import ignores it. Delete or leave it."]
for i, v in enumerate(ex, start=1):
    if v is not None:
        pr.cell(row=2, column=i, value=v)
WEIGHTS = "{1,3,1,3,1,3,1,3,1,3,1,3}"
POS = "{1,2,3,4,5,6,7,8,9,10,11,12}"
for r in range(2, LAST + 1):
    ok_gtin = (f'IF(COUNTIF($A$3:$A${LAST},A{r})>1,"✗ Duplicate GTIN","✓ Valid")'
               if r >= 3 else '"✓ Valid"')
    pr[f"B{r}"] = (f'=IF(A{r}="","",IF(AND(LEN(A{r})=13,ISNUMBER(--A{r})),'
                   f'IF(MOD(10-MOD(SUMPRODUCT(--MID(A{r},{POS},1),{WEIGHTS}),10),10)=--RIGHT(A{r},1),'
                   f'{ok_gtin},"✗ Check digit wrong"),"✗ Must be 13 digits"))')
    lo, hi = (2, 2) if r == 2 else (3, LAST)
    pr[f"K{r}"] = (f'=IF(J{r}="","",IFERROR(INDEX(Manufacturers!$B${lo}:$B${hi},'
                   f'MATCH(J{r},Manufacturers!$A${lo}:$A${hi},0)),"✗ ID not on Manufacturers sheet"))')
    pr[f"N{r}"].number_format = '"₹"#,##0.00'
    if r >= 3:
        pr[f"M{r}"] = "Auspharma Private Limited"
add_list(pr, f"E3:E{LAST}", RNG["A"], "Dosage form", "Choose a dosage form from the list.")
add_list(pr, f"G3:G{LAST}", RNG["D"], "Pack type", "Choose a pack type from the list.")
add_list(pr, f"H3:H{LAST}", RNG["B"], "Schedule", "Choose a schedule from the list.")
add_list(pr, f"I3:I{LAST}", RNG["C"], "Therapy area", "Choose a therapy area from the list.")
add_list(pr, f"O3:O{LAST}", RNG["E"], "MRP per", "Choose from the list.")
add_list(pr, f"J3:J{LAST}", f"Manufacturers!$A$3:$A${LAST}", "Manufacturer ID",
         "Add the manufacturer on the Manufacturers sheet first.")
dv = DataValidation(type="decimal", operator="greaterThan", formula1="0", allow_blank=True,
                    showErrorMessage=True, errorTitle="MRP", error="MRP must be a number above 0.")
pr.add_data_validation(dv)
dv.add(f"N3:N{LAST}")
dv = DataValidation(type="whole", operator="between", formula1="1", formula2="120", allow_blank=True,
                    showErrorMessage=True, errorTitle="Shelf life", error="Months, 1 to 120.")
pr.add_data_validation(dv)
dv.add(f"Q3:Q{LAST}")

# ---------------------------------------------------------------- Batches
ba = wb.create_sheet("Batches", 2)
BA_COLS = [
    ("GTIN-13", 16, "input", "Must match a GTIN on the Products sheet."),
    ("Product (auto)", 30, "calc", "Calculated from GTIN."),
    ("Batch no.", 14, "input", "Exactly as printed on the pack. Letters, digits and hyphens only "
                               "(no spaces or /), because it becomes part of the web address."),
    ("Mfg. date", 12, "input", "DD-MM-YYYY (use the 1st of the month if the pack shows month/year only)."),
    ("Expiry date", 12, "input", "DD-MM-YYYY (use the last day of the month if the pack shows month/year only)."),
    ("Date check (auto)", 18, "calc", "Calculated."),
    ("MRP for this batch (₹), if different", 16, "input", "Leave blank if same as the Products sheet."),
    ("CoA PDF file name (auto)", 30, "calc",
     "Name your CoA PDF exactly like this before uploading: {GTIN}_{Batch}.pdf"),
    ("PIL version packed", 16, "input", "Leave blank to use the product's current PIL version."),
    ("Notes", 26, "input", None),
]
header(ba, BA_COLS)
style_rows(ba, BA_COLS)
text_cols(ba, ["A", "C", "I"])
date_cols(ba, ["D", "E"])
ex = ["8900000000005", None, "EX24001", date(2026, 1, 1), date(2027, 12, 31), None, None, None,
      "v1 / 01-2026", "EXAMPLE row: the import ignores it."]
for i, v in enumerate(ex, start=1):
    if v is not None:
        ba.cell(row=2, column=i, value=v)
for r in range(2, LAST + 1):
    lo, hi = (2, 2) if r == 2 else (3, LAST)
    ba[f"B{r}"] = (f'=IF(A{r}="","",IFERROR(INDEX(Products!$C${lo}:$C${hi},'
                   f'MATCH(A{r},Products!$A${lo}:$A${hi},0)),"✗ GTIN not on Products sheet"))')
    ok_batch = (f'IF(COUNTIFS($A$3:$A${LAST},A{r},$C$3:$C${LAST},C{r})>1,"✗ Duplicate batch","✓ OK")'
                if r >= 3 else '"✓ OK"')
    ba[f"F{r}"] = (f'=IF(OR(D{r}="",E{r}=""),"",IF(E{r}>D{r},'
                   f'{ok_batch},"✗ Expiry before Mfg."))')
    ba[f"H{r}"] = f'=IF(OR(A{r}="",C{r}=""),"",A{r}&"_"&C{r}&".pdf")'
    ba[f"G{r}"].number_format = '"₹"#,##0.00'
dv = DataValidation(type="custom",
                    formula1='AND(ISERROR(SEARCH(" ",C3)),ISERROR(SEARCH("/",C3)),ISERROR(SEARCH("\\",C3)))',
                    allow_blank=True, showErrorMessage=True, errorTitle="Batch no.",
                    error="Use letters, digits and hyphens only (no spaces, / or \\).")
ba.add_data_validation(dv)
dv.add(f"C3:C{LAST}")
dv = DataValidation(type="date", operator="greaterThan", formula1="DATE(2000,1,1)", allow_blank=True,
                    showErrorMessage=True, errorTitle="Date", error="Enter a date (DD-MM-YYYY).")
ba.add_data_validation(dv)
dv.add(f"D3:E{LAST}")

# ---------------------------------------------------------------- Instructions
ins = wb.create_sheet("Instructions", 0)
ins.column_dimensions["A"].width = 4
ins.column_dimensions["B"].width = 110
rows = [
    ("title", "AUS Pharma: product & batch import template"),
    ("p", "Fill this in for the website's product database. The website team imports it into the admin; "
          "nothing goes live until QA approves it in the admin."),
    ("h", "Colour key"),
    ("key-input", "Light yellow cells: type here."),
    ("key-calc", "Pale green cells, grey headers: calculated automatically. Do not type here."),
    ("key-ex", "Grey italic row 2 on each sheet: an EXAMPLE. The import ignores any row whose first cell "
               "starts with EXAMPLE or whose name contains EXAMPLE."),
    ("h", "Order to fill the sheets"),
    ("p", "1. Manufacturers: one row per WHO-GMP certified manufacturing partner (site)."),
    ("p", "2. Products: one row per pack / GTIN. Pick the Manufacturer ID from the dropdown."),
    ("p", "3. Batches: one row per batch you want a Certificate of Analysis (CoA) online for."),
    ("p", "Check the (auto) columns: everything should read ✓. Fix any ✗ before sending."),
    ("h", "PDF files to send with this sheet (name them exactly like this)"),
    ("p", "• WHO-GMP certificate:   {Manufacturer ID}_WHO-GMP.pdf     e.g. MFR-001_WHO-GMP.pdf"),
    ("p", "• Patient information leaflet (approved PIL / package insert):   {GTIN}_PIL.pdf     "
          "e.g. 8906219880070_PIL.pdf"),
    ("p", "• Certificate of Analysis:   {GTIN}_{Batch no.}.pdf     e.g. 8906219880070_EX24001.pdf  "
          "(the Batches sheet shows the exact name in the 'CoA PDF file name' column)"),
    ("p", "• Pack photo (optional):   {GTIN}.jpg"),
    ("h", "Rules that matter"),
    ("p", "• Copy every value exactly as printed on the approved label / leaflet. Do not shorten or reword."),
    ("p", "• GTIN must be the 13-digit number from the pack barcode; the sheet checks the GS1 check digit."),
    ("p", "• Batch numbers: letters, digits and hyphens only, because they become part of the web address "
          "auspharma.in/{GTIN}/{batch} printed in the QR code."),
    ("p", "• Upload only the approved, signed CoA / PIL documents. They are shown to the public as they are."),
    ("p", "• The PIL text itself is entered in the website admin (section by section), not in this sheet."),
    ("p", "• Leave a cell blank rather than guessing. Unknown values hold back that row, they do not break the import."),
    ("h", "Questions"),
    ("p", "Ask the website team. Do not change the column headers or the Lists sheet; the importer reads them."),
]
r = 1
for kind, text in rows:
    c = ins.cell(row=r, column=2, value=text)
    c.alignment = Alignment(wrap_text=True, vertical="top")
    if kind == "title":
        c.font = Font(name=FONT, bold=True, size=16, color=TEAL)
        ins.row_dimensions[r].height = 28
    elif kind == "h":
        c.font = Font(name=FONT, bold=True, size=12, color="08524C")
        r += 0
    else:
        c.font = Font(name=FONT, size=10)
    if kind == "key-input":
        c.fill = PatternFill("solid", fgColor=INPUT)
    elif kind == "key-calc":
        c.fill = PatternFill("solid", fgColor=CALC_FILL)
    elif kind == "key-ex":
        c.fill, c.font = PatternFill("solid", fgColor=EXAMPLE_FILL), EX_FONT
    if kind == "h":
        ins.row_dimensions[r].height = 22
    r += 1
ins.sheet_view.showGridLines = False

for ws in (mf, pr, ba):
    ws.sheet_properties.tabColor = TEAL
ins.sheet_properties.tabColor = "FFB84D"
lists.sheet_properties.tabColor = "C9D3D2"
wb.active = 0
wb.save(OUT)
print("saved", OUT)
