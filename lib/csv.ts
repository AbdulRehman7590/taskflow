/** Quote every cell and neutralize spreadsheet formulas in user-provided text. */
export function toCsv(rows: (string | number | null)[][]) {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((value) => {
            let cell = String(value ?? "");
            if (/^[\s\u0000-\u001f]*[=+@-]/.test(cell)) cell = `'${cell}`;
            return `"${cell.replace(/"/g, '""')}"`;
          })
          .join(","),
      )
      .join("\r\n") +
    "\r\n"
  );
}
