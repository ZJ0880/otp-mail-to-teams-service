export interface TeamsCardField {
  label: string;
  value: string;
}

export interface TeamsCardAction {
  title: string;
  url: string;
  style?: "default" | "positive" | "destructive";
}

export interface TeamsCardRenderOptions {
  subtitle?: string;
  iconUrl?: string;
  accentText?: string;
}

export function buildStyledAdaptiveCard(
  title: string,
  fields: TeamsCardField[],
  actions: TeamsCardAction[] = [],
  options: TeamsCardRenderOptions = {},
): Record<string, unknown> {
  const headerColumns: Array<Record<string, unknown>> = [
    {
      type: "Column",
      width: "stretch",
      items: [
        {
          type: "TextBlock",
          text: options.accentText ?? "Solicitud de aprobación",
          size: "Small",
          weight: "Bolder",
          color: "Light",
          wrap: true,
          spacing: "None",
        },
        {
          type: "TextBlock",
          text: title,
          size: "Large",
          weight: "Bolder",
          color: "Light",
          wrap: true,
          spacing: "None",
        },
        ...(options.subtitle
          ? [
              {
                type: "TextBlock",
                text: options.subtitle,
                size: "Small",
                color: "Light",
                wrap: true,
                spacing: "Small",
              },
            ]
          : []),
      ],
    },
  ];

  if (options.iconUrl) {
    headerColumns.push({
      type: "Column",
      width: "auto",
      items: [
        {
          type: "Image",
          url: options.iconUrl,
          altText: title,
          size: "Small",
          style: "Person",
        },
      ],
    });
  }

  return {
    $schema: "https://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "Container",
        style: "accent",
        bleed: true,
        items: [
          {
            type: "ColumnSet",
            columns: headerColumns,
          },
        ],
      },
      {
        type: "Container",
        spacing: "Medium",
        items: fields.map((field) => ({
          type: "Container",
          separator: true,
          spacing: "Small",
          items: [
            {
              type: "TextBlock",
              text: field.label,
              weight: "Bolder",
              wrap: true,
              size: "Small",
              color: "Accent",
              spacing: "None",
            },
            {
              type: "TextBlock",
              text: field.value,
              wrap: true,
              size: "Medium",
              spacing: "None",
            },
          ],
        })),
      },
    ],
    actions: actions.map((action) => ({
      type: "Action.OpenUrl",
      title: action.title,
      url: action.url,
      style: action.style,
    })),
  };
}

export function buildTeamsWorkflowPayload(
  adaptiveCard: Record<string, unknown>,
  fallbackText: string,
): Record<string, unknown> {
  return {
    type: "message",
    text: fallbackText,
    body: adaptiveCard,
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: adaptiveCard,
      },
    ],
  };
}