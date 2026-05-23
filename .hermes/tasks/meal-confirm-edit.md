# Meal Confirm/Edit Flow — Spec

## Problem
After AI analyzes a photo, items auto-populate but the kid can only REMOVE items, not edit them. If AI says "Unclear" or guesses wrong protein/portion, the kid has to delete and search manually. This kills the flow.

## Current State
- Items show: name · name_zh, portion_label, protein_g, [×] remove button
- Footer: Total protein, [Add more], [Confirm]
- No edit capability on individual items
- No confidence indicator

## Changes Required

### 1. Make Items Tappable to Edit (MealLogModal.astro)
Each item row should be tappable. Tapping opens an inline edit mode for that item:
- Food name (text input, pre-filled)
- Portion (text input, pre-filled with portion_label)
- Protein (number input, pre-filled with protein_g)
- [Save] [Cancel] buttons

The edit should be inline (expand the row in place, don't open a new modal). Keep it fast.

### 2. Show Confidence Indicator
For AI-detected items, show a subtle confidence indicator next to the protein value:
- High confidence (0.8+): no indicator (default, looks clean)
- Medium confidence (0.5-0.79): small yellow dot or "≈" prefix on protein
- Low confidence (0-0.49): small red dot or "?" prefix on protein

This tells the kid "double check this one" without being annoying about high-confidence items.

Update the renderItems() function to pass confidence through and render the indicator.

### 3. Review State After Photo Analysis
After AI analysis completes, change the status message from "Adjust if needed, then confirm" to something more actionable:

For real AI results: "AI found X items — tap any to adjust"
For mock results: "AI couldn't identify this — tap items to edit, or remove and search"
For "Unclear" items (name === "Unclear"): auto-highlight that row as needing attention

### 4. Add "Search to Replace" When Removing AI Item
When a kid removes an AI-detected item, show a quick "Search food" button in place of the removed item, so they can search and replace without going back to the main choice screen.

### 5. CSS Changes
- Item rows get `cursor: pointer` and a subtle hover state to indicate tappability
- Edit mode: light gray background on the editing row, inputs styled consistently with the search input
- Confidence dots: 8px circle, positioned right of protein value
  - Yellow: `background: #F5A623`
  - Red: `background: #D3191F`

## Files to Modify
- `src/components/MealLogModal.astro` — renderItems(), add inline edit, confidence indicators, review state messaging

## What NOT to Change
- Photo capture flow (keep as-is)
- Search flow (keep as-is)
- Confirm + save logic (keep as-is)
- Edge function / AI model (keep as-is)
- Food database (keep as-is)

## UX Flow After Changes
1. Kid takes photo
2. Photo shows with "Analyzing…"
3. AI returns items with confidence scores
4. Status: "AI found 3 items — tap any to adjust" (or "AI couldn't identify this" for mock)
5. Items render with confidence indicators (yellow/red dots for uncertain items)
6. Kid taps an item → inline edit (name, portion, protein)
7. Kid adjusts, saves, confirms
8. Done

## Testing
- Photo with clear food: AI returns high-confidence items, no dots shown
- Photo with vague food: AI returns low-confidence items, dots shown, kid can edit
- Mock fallback: "AI couldn't identify" message, items editable
- Remove an AI item: "Search food" replacement button appears
- Edit inline: name/portion/protein all editable, save works