# SourceFirewall Design System

## Color Tokens
- Background: `#09090b` (Deep Obsidian)
- Surface: `#0c0c0e` (Elevated Obsidian)
- Border: `#1c1c1f` (Whisper-thin charcoal)
- Text Primary: `#f4f1ea` (Warm Ivory)
- Text Secondary: `#8f8e8a` (Muted Stone)
- Threat High: `#c25e4a` (Muted Terracotta)

## Typography
- Display/Headlines: `Instrument Serif`, italic, tight tracking.
- Body/Reading: `Inter`, light, relaxed line-height.
- Telemetry/Metadata: `JetBrains Mono`, uppercase, tracking `0.2em`, text `10px` or `11px`.

## Architecture Rules (Workbench)
- **DO NOT** use vertical sidebars or split-screen layouts.
- **DO** use a single-column, centered, max-width layout to allow typography to breathe.
- **DO** use a horizontal tab bar at the top of the workspace to toggle between active records (e.g., REC_8992 [QUARANTINED] and REC_8991 [CLEARED]).
- **DO NOT** use heavy borders or nested boxes for telemetry grids. Flatten the data using alignment and proximity.
- **DO** implement progressive disclosure: prominently display the single triggered threat extract and rationale, while collapsing safe vectors.
