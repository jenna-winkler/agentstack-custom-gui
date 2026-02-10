import { FormField, Part } from "agentstack-sdk";
import { config } from "./config";
import { DEV_PROXY_ORIGINS } from "./constants";
import { UIMessage } from "./types";

export function rewriteDevProxyRequest(input: RequestInfo | URL) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const { baseUrl } = config;

  let parsed: URL;

  try {
    parsed = new URL(url, baseUrl);
  } catch {
    return input;
  }

  if (!DEV_PROXY_ORIGINS.has(parsed.origin)) {
    return input;
  }

  const proxiedUrl = `${baseUrl}${parsed.pathname}${parsed.search}${parsed.hash}`;

  if (typeof input === "string" || input instanceof URL) {
    return proxiedUrl;
  }

  return new Request(proxiedUrl, input);
}

export function createElement<K extends keyof HTMLElementTagNameMap>({
  tagName,
  id,
  classes,
  content,
}: {
  tagName: K;
  id?: string;
  classes?: string[];
  content?: string;
}): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (id) {
    element.id = id;
  }

  if (classes) {
    element.classList.add(...classes);
  }

  if (content) {
    element.textContent = content;
  }

  return element;
}

export function createFieldElement(field: FormField) {
  const { type } = field;

  switch (type) {
    case "checkbox":
    case "date":
    case "text":
      const inputelement = createElement({ tagName: "input" });

      inputelement.type = type;

      if ("placeholder" in field && field.placeholder) {
        inputelement.placeholder = field.placeholder;
      }

      return inputelement;
    case "file":
      const fileInputElement = createElement({ tagName: "input" });

      fileInputElement.type = "file";
      fileInputElement.accept = field.accept.join(",");
      fileInputElement.multiple = true;

      return fileInputElement;
    case "singleselect":
    case "multiselect":
      const selectElement = createElement({ tagName: "select" });

      selectElement.multiple = type === "multiselect";

      field.options.forEach(({ id, label }) => {
        const optionElement = createElement({ tagName: "option", content: label });
        optionElement.value = id;

        selectElement.appendChild(optionElement);
      });

      return selectElement;
  }
}

export function createUiMessage({
  id = crypto.randomUUID(),
  timestamp = new Date(),
  role,
  text,
  metadata,
}: Partial<UIMessage> & Pick<UIMessage, "role" | "text">) {
  const message: UIMessage = {
    id,
    role,
    text,
    timestamp,
    metadata,
  };

  return message;
}

export function getTextFromParts(parts: Part[] | undefined) {
  const text = parts
    ?.filter((part) => part.kind === "text")
    .map(({ text }) => text)
    .join("\n");

  return text;
}

export function getErrorMessage(error: unknown, fallback?: string) {
  return error instanceof Error ? error.message : (fallback ?? "Unknown error");
}
