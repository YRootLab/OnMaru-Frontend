# Odii and Hanok Performance Design

## Goal

Remove the measured loading, rendering, and transition bottlenecks from the Odii and Hanok pages without changing their visible UI, color, typography, user flow, content order, or perceived animation design.

## Non-Negotiable Compatibility

- Preserve the current layout, copy, colors, typography, controls, navigation, and interaction sequence.
- Preserve the current animation intent, direction, distance, duration, easing, and reveal order. Optimizations may change how an effect is implemented, but not how it looks or when the visitor experiences it.
- Keep the existing skeleton dimensions and loaded-content geometry aligned.
- Preserve one-time scroll reveals and reload behavior. Already viewed sections must remain revealed, and reduced-motion users must receive the same functional state without motion.
- Keep current mock and fallback behavior while the backend API is unfinished.
- Do not couple UI components to a concrete backend URL or raw response shape.

## Baseline

The production build currently shows these measurable costs:

| Surface | Current baseline |
| --- | --- |
| `/odii` HTML | 300,920 bytes |
| `/hanok` HTML | 683,858 bytes |
| `/odii` initial JS | 1,097,950 raw bytes / 341,609 gzip bytes |
| `/hanok` initial JS | 907,161 raw bytes / 278,010 gzip bytes |
| Odii Emotion output | One 12,928-byte stylesheet repeated 9 times |
| Hanok Emotion output | One 47,046-byte stylesheet repeated 11 times |
| Hanok archive payload | 259 villages, 235 with images |
| Odii initial API activity | At least four distinct list requests, about 193 KB of response data |

## Architecture

### Data-source boundary

UI components continue to depend on the existing domain-level `IOdiiApiService` and Hanok domain types. Concrete URL construction, query parameter naming, transport behavior, and raw response parsing live behind adapters.

The Odii network adapter accepts an endpoint resolver and response decoder. The default implementation preserves `/api/odii`, while tests or future backends can replace the endpoint and decoder without editing components or orchestration hooks. Existing API service injection through `OdiiDependencyProvider` remains supported.

Hanok keeps `HanokArchiveService` as its server-side repository boundary. Client-side map code receives normalized `Village` records only and never depends on the TourAPI response shape.

### Loading tiers

Loading is divided by visitor need:

1. Critical content loads at page entry.
2. Near-viewport content starts loading shortly before intersection.
3. Interaction-only code loads when the user opens or activates it.

For Odii, the initial archive request becomes the shared source for hero and archive content where the requested dataset overlaps. Nearby and section-specific data retain independent loading states, but the lower sound-map request starts only near its section. Category-specific editorial data remains cached and loads on proximity or intent.

For Hanok, the archive data remains available to preserve the current page content. The Kakao SDK, interactive-map bundle, marker construction, and image-bearing overlays start only when the existing map frame approaches the viewport. The loading frame keeps exactly the current map dimensions.

Closed drawers and modals are split from the initial route bundle and loaded on intent. Their open/close behavior and animations remain unchanged.

### Rendering and transitions

Emotion server insertion tracks newly inserted style names and flushes only those names on each server insertion pass. It must never emit the full accumulated cache repeatedly.

Scroll handlers collect measurements once per animation frame. Visual indicators that do not affect semantic React output update through refs; React state changes only when the visible item/range changes.

Large reveal and accordion animations preserve their current appearance. Paint-heavy or layout-wide work is isolated so the browser can composite equivalent transforms where possible. If exact equivalence cannot be demonstrated, the existing animation implementation stays in place rather than accepting a visual regression.

The Hanok map owns every Kakao listener, marker, overlay, timer, and observer it creates. Reconfiguration removes previous resources before adding replacements, and unmount removes all remaining resources.

## Component Responsibilities

- `EmotionRegistry`: collect and flush only newly inserted Emotion rules.
- Odii network adapter: resolve endpoint, execute requests, decode raw payloads, and expose normalized API responses.
- Odii API service: cache and map normalized transport responses into domain stories.
- Odii page orchestration hook/container: coordinate critical and deferred requests and expose loading/error state.
- Odii presentational sections: render data and callbacks without constructing concrete API URLs.
- Viewport loader hook/component: trigger an idempotent load when a reserved frame approaches the viewport, with an immediate functional fallback when observers are unsupported.
- Hanok map frame: render its existing placeholder first, then activate the map through the viewport loader.
- Kakao map component: own and dispose of SDK resources.

## Data Flow

### Odii

`OdiiAudioFeature` receives an injected domain service, requests the critical initial page once, and derives the initial hero subset from that result. Deferred sections call the same service contract only after their viewport or interaction trigger. The adapter decides where and how to fetch; components do not know the URL or raw JSON structure.

Errors remain scoped to the section that requested data. Existing fallback data remains visible when available. Retry invalidates only the failed request scope instead of remounting unrelated sections.

### Hanok

The server repository fetches and normalizes TourAPI data as it does today. `HanokArchive` renders the same sections in the same order. The map receives the normalized list but does not import the interactive implementation or Kakao SDK until near-viewport activation.

## Error Handling

- Adapter decoding failures produce domain errors without exposing backend payload details to components.
- A changed or unavailable Odii endpoint falls back through the existing service behavior and UI error path.
- Unsupported `IntersectionObserver` environments load deferred content immediately so functionality is unchanged.
- Kakao SDK failures keep the current map error state.
- Deferred module failures do not remove reserved layout space.
- Abort or stale-request guards prevent late responses from overwriting a newer category, page, or region selection.

## Testing

Tests are written before production changes for:

- Emotion incremental flush behavior and absence of repeated style output.
- Viewport loader idempotence, unsupported-browser fallback, and cleanup.
- Odii endpoint resolver and response decoder injection.
- Initial Odii request deduplication and deferred section loading.
- Kakao listener/overlay/marker cleanup through an injected map facade or focused lifecycle helpers.
- Carousel frame batching and no redundant semantic state update within one frame.
- Reveal-state persistence and reduced-motion behavior.
- Hanok grid identity and pagination behavior without full-list remount semantics.

Existing tests, lint, TypeScript/build, and fresh production artifact measurements run after implementation. The final report compares HTML size, duplicated style count, initial JS, and initial request count against the baseline above.

## Delivery Order

1. Correct Emotion incremental flushing and verify HTML output.
2. Introduce reusable viewport activation with tests.
3. Make Odii transport and decoding replaceable, then consolidate and defer requests.
4. Defer interaction-only Odii modules and batch carousel updates.
5. Defer Hanok map activation and make Kakao resource cleanup deterministic.
6. Optimize equivalent transition internals without changing perceived motion.
7. Run regression, build, and production artifact verification.

## Out of Scope

- Redesigning either page.
- Changing colors, typography, copy, section order, or navigation.
- Replacing the current backend APIs or choosing their future schemas.
- Introducing a new animation library.
- Adding native route View Transitions in this pass, because that would add visible behavior rather than preserve the existing flow.
