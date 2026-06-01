type ReadingTextBlock =
  | {
      type: "heading";
      text: string;
    }
  | {
      type: "verse";
      number: string;
      text: string;
    }
  | {
      type: "paragraph";
      text: string;
    };

type CatechismContentBlock =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "heading";
      text: string;
    }
  | {
      type: "dashList";
      leadIn: string;
      items: string[];
    }
  | {
      type: "numberedList";
      leadIn: string;
      items: string[];
    };

type CatechismTextBlock =
  | {
      type: "heading";
      text: string;
    }
  | {
      type: "paragraph";
      number: string;
      content: CatechismContentBlock[];
    }
  | {
      type: "text";
      content: CatechismContentBlock[];
    };

type ReadingTextRendererProps = {
  text: string;
  variant?: "scripture" | "catechism";
};

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitIntoReadableParagraphs(text: string) {
  const cleaned = normalizeWhitespace(text);

  if (!cleaned) {
    return [];
  }

  const explicitParagraphs = cleaned
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) {
    return explicitParagraphs;
  }

  const sentences =
    cleaned.match(/[^.!?]+[.!?]+["'”’)]*|[^.!?]+$/g)?.map((sentence) =>
      sentence.trim()
    ) ?? [cleaned];

  const paragraphs: string[] = [];
  let current: string[] = [];
  let currentLength = 0;

  for (const sentence of sentences) {
    const nextLength = currentLength + sentence.length;

    if (current.length > 0 && (current.length >= 3 || nextLength > 420)) {
      paragraphs.push(current.join(" ").trim());
      current = [sentence];
      currentLength = sentence.length;
    } else {
      current.push(sentence);
      currentLength = nextLength;
    }
  }

  if (current.length > 0) {
    paragraphs.push(current.join(" ").trim());
  }

  return paragraphs;
}

function hasStructuredReadingMarkers(text: string) {
  return /^###\s+\S/m.test(text) || /^\*\*\d+\.\*\*\s+\S/m.test(text);
}

function stripMarkdownArtifacts(text: string) {
  return text.replace(/\*\*/g, "").trim();
}

function parseStructuredReadingText(text: string): ReadingTextBlock[] {
  const lines = normalizeWhitespace(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line): ReadingTextBlock | null => {
      const headingMatch = line.match(/^###\s+(.+)$/);
      if (headingMatch) {
        return {
          type: "heading",
          text: stripMarkdownArtifacts(headingMatch[1]),
        };
      }

      const verseMatch = line.match(/^\*\*(\d+)\.\*\*\s+(.+)$/);
      if (verseMatch) {
        return {
          type: "verse",
          number: verseMatch[1],
          text: stripMarkdownArtifacts(verseMatch[2]),
        };
      }

      return {
        type: "paragraph",
        text: stripMarkdownArtifacts(line),
      };
    })
    .filter((block): block is ReadingTextBlock => Boolean(block?.text));
}

function stripCatechismParagraphMarker(text: string) {
  return text.replace(/^\*\*(\d{1,4})\.\*\*\s+/, "$1 ");
}

function extractTerminalHeading(text: string): {
  body: string;
  heading: string | null;
} {
  const match = text.match(
    /\s+((?:[IVX]{1,6}\.|Article\s+\d+\.|Chapter\s+\d+\.|Paragraph\s+\d+\.)\s+[A-Z][^.!]{2,96}[.?]?)$/
  );

  if (!match || match.index === undefined) {
    return { body: text, heading: null };
  }

  return {
    body: text.slice(0, match.index).trim(),
    heading: match[1].trim(),
  };
}

function parseDashList(text: string): CatechismContentBlock | null {
  const listStart = text.indexOf(": —");

  if (listStart === -1) {
    return null;
  }

  const listText = text.slice(listStart + 2).trim();
  const items = listText
    .split(/\s+—(?=\S)/)
    .map((item) => item.replace(/^—/, "").trim())
    .filter(Boolean);

  if (items.length < 2) {
    return null;
  }

  return {
    type: "dashList",
    leadIn: text.slice(0, listStart + 1).trim(),
    items,
  };
}

function parseNumberedList(text: string): CatechismContentBlock | null {
  const listStart = text.search(/\b1\.\s+[A-Z]/);

  if (listStart === -1 || !/\b2\.\s+[A-Z]/.test(text.slice(listStart))) {
    return null;
  }

  const leadIn = text.slice(0, listStart).trim();
  const listText = text.slice(listStart).trim();
  const matches = [...listText.matchAll(/(?:^|\s)(\d+)\.\s+/g)];

  if (matches.length < 2) {
    return null;
  }

  const items = matches
    .map((match, index) => {
      const itemStart = (match.index ?? 0) + match[0].length;
      const nextStart = matches[index + 1]?.index ?? listText.length;
      return listText.slice(itemStart, nextStart).trim();
    })
    .filter(Boolean);

  if (items.length < 2) {
    return null;
  }

  return {
    type: "numberedList",
    leadIn,
    items,
  };
}

function parseCatechismContent(text: string): CatechismContentBlock[] {
  const { body, heading } = extractTerminalHeading(text);
  const blocks: CatechismContentBlock[] = [];
  const dashList = parseDashList(body);
  const numberedList = dashList ? null : parseNumberedList(body);

  if (dashList) {
    blocks.push(dashList);
  } else if (numberedList) {
    blocks.push(numberedList);
  } else if (body) {
    blocks.push({ type: "text", text: body });
  }

  if (heading) {
    blocks.push({ type: "heading", text: heading });
  }

  return blocks;
}

function isCatechismHeadingLine(text: string) {
  return (
    /^IN BRIEF$/i.test(text) ||
    /^(?:[IVX]{1,6}\.|Article\s+\d+\.|Chapter\s+\d+\.|Paragraph\s+\d+\.)\s+\S/.test(
      text
    )
  );
}

function parseCatechismText(text: string): CatechismTextBlock[] {
  const blocks = normalizeWhitespace(text)
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  return blocks
    .flatMap((block): CatechismTextBlock[] => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      return lines.map((line): CatechismTextBlock => {
        const headingMatch = line.match(/^#{2,3}\s+(.+)$/);
        if (headingMatch) {
          return {
            type: "heading",
            text: stripMarkdownArtifacts(headingMatch[1]),
          };
        }

        const normalizedLine = stripCatechismParagraphMarker(line);
        if (isCatechismHeadingLine(normalizedLine)) {
          return {
            type: "heading",
            text: stripMarkdownArtifacts(normalizedLine),
          };
        }

        const paragraphMatch = normalizedLine.match(/^(\d{1,4})\s+(.+)$/);

        if (paragraphMatch) {
          return {
            type: "paragraph",
            number: paragraphMatch[1],
            content: parseCatechismContent(
              stripMarkdownArtifacts(paragraphMatch[2])
            ),
          };
        }

        return {
          type: "text",
          content: parseCatechismContent(stripMarkdownArtifacts(line)),
        };
      });
    })
    .filter((block) => {
      if (block.type === "heading") return Boolean(block.text);
      return block.content.length > 0;
    });
}

function renderCatechismContent(blocks: CatechismContentBlock[]) {
  return blocks.map((block, index) => {
    if (block.type === "heading") {
      return (
        <h4
          key={`content-${index}`}
          className="pt-2 text-sm font-semibold uppercase text-monastic-2 sm:text-base"
        >
          {block.text}
        </h4>
      );
    }

    if (block.type === "dashList") {
      return (
        <div key={`content-${index}`} className="space-y-3">
          <p>{block.leadIn}</p>
          <ul className="space-y-2 pl-0">
            {block.items.map((item, itemIndex) => (
              <li
                key={`dash-${itemIndex}`}
                className="grid grid-cols-[1.1rem_minmax(0,1fr)] gap-2"
              >
                <span className="text-monastic-2">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (block.type === "numberedList") {
      return (
        <div key={`content-${index}`} className="space-y-3">
          {block.leadIn ? <p>{block.leadIn}</p> : null}
          <ol className="space-y-2 pl-5">
            {block.items.map((item, itemIndex) => (
              <li key={`numbered-${itemIndex}`} className="pl-1">
                {item}
              </li>
            ))}
          </ol>
        </div>
      );
    }

    return <p key={`content-${index}`}>{block.text}</p>;
  });
}

function CatechismTextRenderer({ text }: { text: string }) {
  const blocks = parseCatechismText(text);

  return (
    <article className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3
              key={`catechism-${index}`}
              className="border-t border-monastic pt-5 text-sm font-semibold uppercase text-monastic-2 first:border-t-0 first:pt-0 sm:pt-6 sm:text-base"
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === "text") {
          return (
            <section
              key={`catechism-${index}`}
              className="min-w-0 break-words border-t border-monastic pt-5 text-[0.95rem] leading-7 text-monastic-0 first:border-t-0 first:pt-0 sm:pt-6 sm:text-base sm:leading-8"
            >
              <div className="space-y-3 sm:space-y-4">
                {renderCatechismContent(block.content)}
              </div>
            </section>
          );
        }

        return (
          <section
            key={`catechism-${index}`}
            className="grid min-w-0 grid-cols-[2.55rem_minmax(0,1fr)] gap-3 border-t border-monastic pt-5 first:border-t-0 first:pt-0 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-4 sm:pt-6"
          >
            <div className="min-w-0">
              <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full border border-monastic px-1.5 text-xs font-semibold leading-none text-monastic-2 sm:min-h-9 sm:min-w-9 sm:text-sm">
                {block.number}
              </span>
            </div>
            <div className="min-w-0 break-words text-[0.95rem] leading-7 text-monastic-0 sm:text-base sm:leading-8">
              <div className="space-y-3 sm:space-y-4">
                {renderCatechismContent(block.content)}
              </div>
            </div>
          </section>
        );
      })}
    </article>
  );
}

export function ReadingTextRenderer({
  text,
  variant = "scripture",
}: ReadingTextRendererProps) {
  if (variant === "catechism") {
    return <CatechismTextRenderer text={text} />;
  }

  if (!hasStructuredReadingMarkers(text)) {
    const paragraphs = splitIntoReadableParagraphs(text);

    return (
      <article className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
        {paragraphs.map((paragraph, index) => (
          <p
            key={`reading-${index}`}
            className="text-[0.95rem] leading-7 text-monastic-0 sm:text-base sm:leading-8"
          >
            {paragraph}
          </p>
        ))}
      </article>
    );
  }

  const blocks = parseStructuredReadingText(text);

  return (
    <article className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3
              key={`reading-${index}`}
              className="pt-3 text-sm font-semibold uppercase text-monastic-2 sm:pt-4 sm:text-base"
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === "verse") {
          return (
            <p
              key={`reading-${index}`}
              className="text-[0.95rem] leading-7 text-monastic-0 sm:text-base sm:leading-8"
            >
              <sup className="mr-1.5 align-super text-[0.62rem] font-semibold leading-none text-monastic-2 sm:text-[0.68rem]">
                {block.number}
              </sup>
              {block.text}
            </p>
          );
        }

        return (
          <p
            key={`reading-${index}`}
            className="text-[0.95rem] leading-7 text-monastic-0 sm:text-base sm:leading-8"
          >
            {block.text}
          </p>
        );
      })}
    </article>
  );
}
