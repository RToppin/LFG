# LFG Architecture Notes

LFG uses Next.js App Router, Auth.js, Prisma, PostgreSQL, Zod, server actions, and focused domain services. The UI is intentionally separate from matching, expiration, Discord invitation validation, authorization, notification, and rate-limit logic.

## Data Model

```mermaid
erDiagram
  User ||--o| Profile : owns
  User ||--o{ Account : authenticates
  User ||--o{ Session : has
  Profile ||--o{ UserGame : plays
  Profile ||--o{ UserAvailability : available
  Game ||--o{ UserGame : selected
  Game ||--o{ LfgPost : listed
  Game ||--o{ GameEdition : offers
  Game ||--o{ GamePlatform : supports
  User ||--o{ LfgPost : creates
  LfgPost ||--o{ GroupMember : includes
  LfgPost ||--o{ JoinRequest : receives
  LfgPost ||--o| DiscordInvitation : has
  User ||--o{ SavedPost : saves
  User ||--o{ DismissedRecommendation : dismisses
  User ||--o{ Notification : receives
  User ||--o{ Block : creates
  User ||--o{ Report : files
  Report ||--o{ ModerationAction : receives
  User ||--o{ AuditLog : acts
```

## Primary User Flow

```mermaid
flowchart TD
  A[Sign in] --> B[Onboarding]
  B --> C[Add games and preferences]
  C --> D[Create LFG post]
  D --> E[Discover active posts]
  E --> F{Join mode}
  F -->|Open| G[Become member]
  F -->|Approval required| H[Submit join request]
  H --> I[Owner reviews request]
  I -->|Approve| G
  I -->|Reject| J[Requester notified]
  G --> K[Discord invite revealed if allowed]
  D --> L[Refresh before expiration]
  L --> E
  D --> M[Expire stale listing]
```

## Future Adapters

The game catalog is local-first and can later receive IGDB or RAWG data through an adapter. Discord communication is invite-based today, with model boundaries prepared for a future bot that could create temporary channels, roles, or membership sync.
