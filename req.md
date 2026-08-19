Absolutely. Since you're starting the implementation, I'd use a prompt that clearly defines the **scope, architecture, UX expectations, and constraints** so the coding agent doesn't waste time rebuilding CTFd.

# Custom CTF Team Registration UI

## Context

We are building a custom **Team Registration UI** for a CTF competition.

The backend infrastructure is **already implemented and maintained by CTFd**. We do **not** need to build or modify the backend, database, authentication system, challenge system, scoring system, or team-management infrastructure.

The existing CTFd instance exposes the APIs required for team registration and management.

Our responsibility is to build a **professional, custom frontend experience** that communicates with the existing CTFd API.

The primary goal is **Hacker Experience (HX)**: the registration process should feel like a purpose-built CTF platform rather than the default CTFd interface.

---

## Primary Objective

Build a polished, responsive **Team Registration experience** that allows a participant to:

1. Understand the competition/team-registration flow.
2. Create a team.
3. Provide the required team information.
4. Validate their input.
5. Submit the information through the provided CTFd API.
6. Receive clear success/error feedback.
7. Continue naturally into the competition after successful registration.

If the existing API/setup supports joining an existing team, provide a corresponding **Join Team** flow as well.

Do not recreate backend functionality that CTFd already provides.

---

## Technical Requirements

### Backend

Use the existing CTFd backend/API.

Do NOT implement:

* A new backend
* A new database
* Custom authentication
* Custom team persistence
* Challenge infrastructure
* Scoring infrastructure
* Flag validation
* KoTH infrastructure
* Duplicate business logic already handled by CTFd

The frontend should act as a client of the existing API.

Use the official CTFd API documentation as the API reference:

[https://docs.ctfd.io/docs/api/getting-started/](https://docs.ctfd.io/docs/api/getting-started/)

For team/KoTH context:

[https://docs.ctfd.io/tutorials/challenges/creating-koth-challenges/](https://docs.ctfd.io/tutorials/challenges/creating-koth-challenges/)

---

## Frontend Scope

The main deliverable is the **Team Registration UI**.

### Core screens

#### 1. Registration Landing / Entry

Create a visually compelling entry point that explains:

* What the competition is
* Why teams are required
* Team-size expectations
* What the participant needs before registering
* Clear CTA to create a team
* Clear CTA to join an existing team, if applicable

Keep the content concise.

Do not overwhelm the participant with documentation.

---

#### 2. Create Team

Create a dedicated registration form containing the fields required by the existing CTFd configuration/API.

At minimum, support:

* Team name
* Team password / confirmation if required
* Any required custom team fields

The UI should make required fields obvious.

Provide real-time or submit-time validation.

Examples:

* Empty team name
* Invalid team name
* Duplicate team name
* Password mismatch
* Missing required field
* API validation error

Never expose raw backend errors directly to the user if they can be translated into useful human-readable feedback.

---

#### 3. Join Team

If joining teams is supported by the configured CTFd instance, provide a separate flow.

Example:

```text
Join an existing team

Team name
[____________________]

Team password
[____________________]

[ Join Team ]
```

Provide clear feedback for:

* Team does not exist
* Incorrect password
* Team is full
* User is already part of a team
* API/network failure
* Successful join

---

#### 4. Success State

After successful registration, do not simply display a generic "200 OK" or raw API response.

Create a proper success experience.

For example:

```text
TEAM INITIALIZED

Team: CYBER PHANTOMS

You're officially registered.

[ Enter Competition ]
```

The exact visual/content treatment can be designed creatively.

---

## Design Direction

The UI should feel like a **modern cybersecurity competition platform**.

Avoid making it look like:

* A generic SaaS dashboard
* A Bootstrap form
* Default CTFd
* An ordinary corporate registration page

Instead, aim for:

* Technical
* Premium
* Minimal
* Futuristic
* Competitive
* Hacker-oriented
* High contrast
* Strong typography
* Excellent spacing
* Subtle motion
* Clear visual hierarchy

The design should communicate:

> "You are entering a serious hacking competition."

Avoid excessive cyberpunk clichés.

Do not cover the interface with random:

* Matrix rain
* Skulls
* Binary characters
* Glitch effects
* Neon everywhere
* Excessive terminal animations

Use these visual ideas only when they genuinely improve the experience.

---

## Visual System

Establish a consistent design system before implementing individual components.

Define:

### Colors

Use a restrained palette with:

* Primary brand color
* Secondary/accent color
* Background
* Surface/card colors
* Text colors
* Muted text
* Success
* Warning
* Error

The colors should maintain strong accessibility and contrast.

### Typography

Use a modern typography system suitable for a technical competition.

Create clear hierarchy for:

* Page title
* Section title
* Body
* Labels
* Helper text
* Buttons
* Status messages

### Components

Create reusable components for:

* Input
* Password input
* Button
* Card
* Alert
* Form field
* Loading state
* Success state
* Error state
* Modal/dialog if necessary

Avoid duplicating styles between screens.

---

## UX Requirements

The experience should be extremely straightforward.

A participant should immediately understand:

1. Where they are.
2. What they need to provide.
3. What will happen after submitting.
4. Whether their submission succeeded.
5. What they should do next.

### Loading

During API requests:

* Disable duplicate submissions.
* Show a clear loading indicator.
* Preserve entered form data.
* Do not make the interface appear frozen.

Example:

```text
[ Creating Team... ]
```

### Errors

Errors should be:

* Visible
* Human-readable
* Actionable
* Positioned close to the relevant input when possible

Example:

Instead of:

```text
400 Bad Request
```

show:

```text
That team name is already taken.
Try another name.
```

### Success

Success should feel meaningful.

Use visual confirmation and a clear next action.

---

## Responsive Design

The UI must work well on:

* Desktop
* Laptop
* Tablet
* Mobile

Do not simply shrink the desktop design.

On mobile:

* Forms should use the full available width.
* Buttons should be easy to tap.
* Typography should remain readable.
* Decorative elements should not interfere with the form.
* Important information should appear before decorative content.

---

## Accessibility

Follow good accessibility practices.

Requirements include:

* Proper labels for every form field
* Keyboard navigation
* Visible focus states
* Appropriate semantic HTML
* Accessible error messages
* Sufficient color contrast
* Do not rely exclusively on color to communicate status
* Buttons must have meaningful labels

---

## API Integration

Create a clean API/service layer.

Do not scatter raw API calls throughout UI components.

Prefer an architecture similar to:

```text
UI
 ↓
Registration Controller / Hook
 ↓
API Service
 ↓
CTFd API
```

Centralize:

* API base URL/configuration
* Authentication handling
* Request handling
* Error normalization
* Response parsing

The UI should not need to understand CTFd's raw error structure.

---

## Security

Never expose sensitive information unnecessarily.

Do not:

* Log passwords
* Store passwords in localStorage
* Hardcode API credentials
* Expose secrets in frontend code
* Bypass CTFd authentication/security mechanisms
* Implement client-side-only authorization

Assume the backend is the source of truth.

Client-side validation is for UX, not security.

---

## State Handling

Explicitly design the following states:

### Form

* Initial
* Editing
* Validation error
* Submitting
* API error
* Success

### Network

* Loading
* Timeout
* Connection failure
* Server error

### Team

* Available
* Already exists
* Successfully created
* Successfully joined
* Full/unavailable

Every important state should have a deliberate UI.

---

## Important Constraint

**Do not over-engineer this project.**

The backend already exists.

The purpose of this work is NOT to recreate CTFd.

The purpose is to create a **custom, high-quality registration experience on top of CTFd**.

Spend the majority of effort on:

* UX
* Visual design
* Interaction quality
* Error handling
* Responsiveness
* Accessibility
* Hacker Experience

rather than rebuilding backend functionality.

---

## Reference Material

Use the provided CTFd documentation for understanding the underlying platform:

CTFd API:

[https://docs.ctfd.io/docs/api/getting-started/](https://docs.ctfd.io/docs/api/getting-started/)

CTFd Team functionality:

[https://docs.ctfd.io/tutorials/teams/creating-and-joining-teams/](https://docs.ctfd.io/tutorials/teams/creating-and-joining-teams/)

CTFd KoTH:

[https://docs.ctfd.io/tutorials/challenges/creating-koth-challenges/](https://docs.ctfd.io/tutorials/challenges/creating-koth-challenges/)

---

## Existing Design Reference

A handwritten planning/reference image has been provided with this project.

Use it as a **requirements/reference artifact**, not as a final visual design.

The image contains notes around:

* Nepal CTF branding/colors
* Team registration
* Team name
* Participant information
* Student/individual/corporate distinctions
* Early-bird/late registration concepts

Translate those requirements into a clean modern interface rather than reproducing the handwritten layout literally.

---

## Deliverable

Produce a production-quality frontend for the Team Registration experience.

The final implementation should feel like a **real CTF competition product**, not a prototype.

Prioritize:

**1. Functional API integration**
**2. Excellent registration UX**
**3. Strong visual identity**
**4. Responsive design**
**5. Robust validation/error states**
**6. Accessibility**
**7. Clean, maintainable frontend architecture**

Before implementing, inspect the existing project structure and identify the framework, styling system, API conventions, and reusable components already present.

Do not introduce a new framework or major dependency unless there is a clear technical reason.

Start by understanding the existing codebase and API contract, then implement the registration experience incrementally.
