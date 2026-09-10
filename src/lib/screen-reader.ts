/** Extracts an accessibility-tree style summary of what is currently on screen. */
export function extractScreenContent(root: ParentNode = document): string {
  const parts: string[] = [];
  const seen = new Set<string>();

  const push = (line: string) => {
    const clean = line.replace(/\s+/g, " ").trim();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      parts.push(clean);
    }
  };

  const label = (el: Element) =>
    el.getAttribute("aria-label") ||
    (el as HTMLElement).innerText ||
    el.getAttribute("alt") ||
    el.getAttribute("placeholder") ||
    el.getAttribute("title") ||
    "";

  root.querySelectorAll("h1, h2, h3, h4").forEach((el) => push(`Heading: ${label(el)}`));
  root.querySelectorAll("button, [role='button']").forEach((el) => push(`Button: ${label(el)}`));
  root.querySelectorAll("a[href]").forEach((el) => push(`Link: ${label(el)}`));
  root.querySelectorAll("input, textarea, select").forEach((el) => {
    const input = el as HTMLInputElement;
    const name =
      input.getAttribute("aria-label") ||
      (input.id && root.querySelector(`label[for="${input.id}"]`)?.textContent) ||
      input.placeholder ||
      input.name ||
      "unnamed";
    push(`Input field: ${name} (type ${input.type || "text"})`);
  });
  root.querySelectorAll("p, li").forEach((el) => {
    const text = (el as HTMLElement).innerText;
    if (text && text.length > 20) push(`Text: ${text.slice(0, 300)}`);
  });

  return parts.slice(0, 80).join("\n");
}
