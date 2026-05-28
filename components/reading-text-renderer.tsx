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

type ReadingTextRendererProps = {
  text: string;
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

export function ReadingTextRenderer({ text }: ReadingTextRendererProps) {
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
