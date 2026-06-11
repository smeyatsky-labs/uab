# Design: SYNTHERA Under Everything — protocols as the builder's choice surface, governance as the ambient substrate

Status: **DESIGN — awaiting ruling.** ADR-grade. Investigated as-built (cited file:line), then
designed. No code, no commits beyond this document. Halts for review.

## Where this doc lives, and why

`smeyatsky-labs/uab/docs/design/` (this repo), **not** `forge-agents/docs/design/`.

The contract doc (`forge-agents/docs/design/uab-forge-agents-contract.md`) is the *engine input
boundary* and is rightly owned by the consumer (forge-agents, D6). **This** doc adjudicates the
**builder's choice surface and UI model** — the composer, the protocol attach surface, the
ambient-governance line, and the demo. That subject is UAB-owned: the wiring is UAB code
(`src/presentation/store/system-composer.store.ts`, `src/presentation/pages/SystemComposerPage.tsx`,
`src/presentation/components/protocols/*`), and the demo is the UAB app. This doc **refines** the
contract's M4 ruling; it does not relocate or fork the schema. Schema ownership stays with
forge-agents (D6, unchanged). §1 specifies exactly how the two docs stay in agreement (one
description, not two).

Repos/paths investigated:
- `smeyatsky-labs/uab` @ working tree (this repo) — the composer + Protocol Explorer.
- `forge-agents` (`~/forge-agents`) — the canonical Pydantic `GovernedSystemSpec` + provisioning.
- `synthera` (`~/synthera`) — the substrate primitives forge-agents calls.

---

## 0. The framing, stated once

Two planes, orthogonal by design:

- **Protocols = what an agent can *speak and do*.** MCP, A2A, AP2, ADK, the full 10-protocol catalog
  (`src/domain/protocols/protocol.types.ts:11-21`). The builder picks these **freely and richly** —
  this is the *primary* builder surface.
- **Governance = what an agent *is* and what it's *allowed to be/do*.** A minted identity (VAID), a
  place in a single-parent delegation tree, an attenuated scope and capability set. This is the
  **ambient substrate** applied to *every* agent automatically, regardless of protocol choice.

SYNTHERA is **not** in the protocol menu. It is not a choice. It is the trust layer *underneath* all
protocol choices. Protocols sit on top and vary wildly; governance sits underneath and is invariant.
**That invariance is the safety property** — and the thing the demo (§5) must make visible.

---

## 1. Reconciliation with M4

**M4 as ruled** (`uab-forge-agents-contract.md:130`):

> UAB's catalog treats **10 protocols as the top-level truth** (flat list, the user's primary
> choice). … Per the Model-2 decision, protocols are **demoted** to per-agent detail. The contract
> carries them as an opaque blob the engine does not read.

And §3.5 (`:214-216`): *"`protocolConfig` is an opaque pass-through. The engine and substrate never
parse it (M4)."*

**The word "demoted" was doing two jobs at once**, and the as-built proves it split badly:

1. **Demoted-in-governance** (correct, load-bearing, *keep verbatim*): protocols never touch
   identity, scope, capability, or lineage. The engine and substrate never read `protocolConfig`.
   This is exactly what forge-agents implements: `protocol_config: dict[str, Any]`
   (`forge-agents/apps/api/src/agent_systems/domain/governed_system_spec.py:80`), never read by the
   model validator (`:115-200`) nor extracted by the provisioner (`tools/forge_operator/provision_system.py:96-101`).

2. **Demoted-in-UX** (an *over-correction*, never actually ruled): the live composer dropped
   protocols **entirely**. `SystemComposerPage` (the routed `builder` view, `src/App.tsx:16`) has
   **no protocol surface at all**; `ComposerRole` has **no** `protocolConfig` field
   (`src/presentation/store/system-composer.store.ts:26-34`); and `composerToSpec` emits agents
   **without** `protocolConfig` (`:152-170`). The rich `ProtocolSelector`/`ProtocolConfigurator`
   exist but are **orphaned** — bound to a legacy single-agent store
   (`src/presentation/components/protocols/ProtocolSelector.tsx:24-25`,
   `ProtocolConfigurator.tsx:17-18`) and mounted nowhere in the live app (confirmed by grep).

**This doc's refinement: keep (1), reverse (2).** Same *opacity* — protocols still never touch
governance. **Flipped emphasis** — protocols are the *primary builder choice surface*, the richest
thing a builder composes, not a "minor per-agent detail." "Demoted" applies to the **governance
plane only**; in the **UX plane** protocols are promoted to first class. M4 ruled the governance
plane; this doc rules the UX plane. They do not contradict; they are orthogonal planes (§0).

**Single-source rule (satisfies the item-1 instruction "update the framing in one place").** On
approval:
- The contract's M4 row keeps its governance-opacity wording and gains a one-line pointer:
  *"UX primacy of the protocol surface is designed in `uab/docs/design/synthera-under-everything.md`;
  opacity-to-governance (this row) is unchanged."*
- The **proposed replacement text** for the M4 *Consequence* cell, so no two divergent live
  descriptions exist:

  > Per the Model-2 decision, protocols are **demoted in the governance plane** — opaque, never read
  > by engine or substrate. They remain the **primary builder choice surface** in the UX plane
  > (see `synthera-under-everything.md`). Orthogonal planes: protocol-rich on top, governance-blind
  > underneath.

No other contract text changes. §3.5's opacity statement stays exactly as written.

---

## 2. The orthogonality invariant — formal

### 2.1 The two disjoint field sets on a role

Every role carried in `GovernedSystemSpec.agents[]` has its fields partitioned into exactly two
sets, with **no third category**:

**G — GOVERNED fields (identity & authority).** Read by the validator, the provisioner, and the
substrate. These *are* what the agent IS and may do.
- `role` → `agent_class` (identity kind) — `governed-system-spec.ts:26`,
  `provision_system.py:100`, `mint_and_inject.py` seed `agentClass`.
- `scopeBoundary` (resource prefixes) → `VaidSeed.scope_boundary` — `governed-system-spec.ts:29-30`,
  enforced by `is_in_scope` (`synthera/.../vaid.rs:188-195`).
- `capabilitySet` (exact-match grants) → `VaidSeed.capability_set` — `governed-system-spec.ts:31`,
  enforced by `has_capability` (`vaid.rs:197-200`).
- `root` → which mint primitive (operator dual-sign vs `mint_child`) — `governed-system-spec.ts:32`.
- Lineage via `delegations[]` → `parent_vaid` — `governed-system-spec.ts:37-40`.
- `tenant.id` → `VaidSeed.tenant_id` — `governed-system-spec.ts:20-22`.

**P — PROTOCOL field (runtime behavior).** Read **only** by the deployed agent's own runtime; never
by validator, provisioner, or substrate.
- `protocolConfig: Record<string, unknown>` — `governed-system-spec.ts:33-34` (typed opaque),
  `governed_system_spec.py:80` (`dict[str, Any]`).

### 2.2 The invariant (load-bearing)

> **An agent's identity, scope, capability, and lineage are functions of G alone.**
> `protocolConfig` (P) can NEVER be a source of any governed field. Formally:
> `derive(identity, scope, capability, lineage)` reads from G and the verified parent context, and
> `G ∩ derivation(P) = ∅`. Authority flows `G → mint → substrate`. Protocol detail flows
> `P → deploy → runtime`. **The two flows never cross.**

Whatever protocols a role speaks, its authority is unchanged. That is the orthogonality, and it is
the safety property: a misconfigured, malicious, or exotic protocol choice cannot widen an agent's
authority by one byte, because the authority path never reads the protocol path.

### 2.3 Where the boundary lives — *guaranteed, not asserted*

Five independent layers hold the line; the last is the strongest because it is type-level absence,
not policy:

| # | Layer | File:line | Guarantee |
|---|-------|-----------|-----------|
| 1 | TS contract type | `governed-system-spec.ts:29-34` | `protocolConfig` is typed `Record<string, unknown>` — opaque by type; governed fields are separately typed. |
| 2 | TS compose-time validator | `governed-system-spec.validator.ts:57-162` | Reads only G (refs, scope, caps, root, edges). **Never references `protocolConfig`.** The UI rejects illegal G *without ever looking at P*. |
| 3 | Pydantic schema + validator | `governed_system_spec.py:80, 115-200` | `protocol_config: dict[str, Any]`; the `model_validator` reads only G. |
| 4 | Provisioner extraction | `provision_system.py:96-101, 61-77` | `AgentSpec`/`PermittedChild` are built from `tenant, scope_boundary, capability_set, role` **only**. `protocol_config` is never read; it rides to deploy config, never to mint. |
| 5 | **Substrate mint type** | `synthera/crates/synthera-bridge/src/mint_vaid.rs` (VaidSeed) | The substrate's seed has **no `protocol_config` field at all**. The boundary is enforced by **absence**: the substrate physically cannot read what its type does not contain. |

Layer 5 is why this is *guaranteed* rather than *asserted*: even a future bug in UAB or the
provisioner cannot make the substrate read a protocol into a governed field, because there is no
field to read into. Identity/scope/caps come only from `VaidSeed.{tenant_id, scope_boundary,
capability_set, parent_vaid}`, and `parent_vaid`/tenant come from the **verified parent VAID**, never
from request body (`mint_vaid.rs:210-227`).

### 2.4 Leak flags — where the invariant is currently SOFT

Three places where a non-governed surface leaks (or could leak) into a governed field. These are the
breaches to fix/forbid:

- **LEAK-1 (live, must fix): `agent-to-spec.ts:40`** —
  `capabilitySet: [...agent.capabilities]` copies UAB's **free-text UI tags** (M3:
  *"`Agent.capabilities[]` = free-text UI tags … unrelated meaning"*, `contract:129`) **directly
  into the governance `capabilitySet`.** This is the exact aliasing the contract forbade (§3.4). It
  is not `protocolConfig`, but it is the *same class* of violation: a non-authoritative UI surface
  sourcing a G field. On the single-agent bridge path, a builder's casual tags become signed
  governance grants. **Ruling needed (D-B).**

- **LEAK-2 (latent, must forbid): `protocol.types.ts:106`** — `ProtocolSpec.capabilities` is a
  *third* "capabilities" namespace (protocol-declared capability strings). If the §4 wiring ever
  auto-derives a role's `capabilitySet` from its selected protocols' `.capabilities`, that is a
  direct `P → capabilitySet` breach. The wiring **must not** do this. **Ruling needed (D-C).**

- **LEAK-3 (clean today, only by omission): the composer path** is currently invariant-safe *only
  because it drops `protocolConfig` entirely* (`composerToSpec:152-170`). When §4 wires protocols
  in, the new `ComposerRole.protocolConfig` must flow to `AgentRole.protocolConfig` **and nowhere
  else** — specifically never into `scopeBoundary` or `capabilitySet` templating
  (`system-composer.store.ts:63-65`).

---

## 3. The ambient-governance UI line

"Ambient" must **not** mean the builder fills two parallel forms (a protocol form *and* a governance
form). It means trust is **non-optional and universal** while the builder composes structure +
protocols. Draw the line precisely between what is **authored** and what is **automatic**:

### 3.1 AUTHORED — visible, composed, part of the design surface

The builder's hands are on these. They are the **structure and the bounds** (the envelope):
- **Delegation tree structure** — who MAY spawn whom. `SystemComposerPage.tsx:59-75` ("Delegated by
  (parent)" select), `DelegationTree` (`:103-127`).
- **Per-role scope prefix and capability grants** — `SystemComposerPage.tsx:78-98`, templated per
  role (D4, `system-composer.store.ts:63-65`).
- **Which role is root** — `SystemComposerPage.tsx:42-44`.
- **Tenant id** — one per system, `SystemComposerPage.tsx:180-184`.
- **(§4) Protocols per role** — the primary, richest part of the surface.

### 3.2 AUTOMATIC — guaranteed, invisible, never a toggle, never in a menu

The substrate just does these to *every* role, identically, no matter what is authored on top:
- **Identity minting** — VAID generation + Ed25519 keygen. The builder never sees a key
  (`mint_and_inject.py`, `transport.py`).
- **PoP signing** — operator dual-sign for the root (`mint_and_inject.py:111-141`); child BYO-key PoP
  (`mint_vaid.rs:250-257`).
- **Attenuation enforcement** — child ⊆ parent, fail-closed (`mint_vaid.rs:231-245`).
- **The over-envelope denial** — a spawn exceeding the parent is rejected
  (`mint_vaid.rs:231-236, 240-245`). Never a setting.
- **Placement in the delegation tree as a minted identity + lineage hash + audit**
  (`mint_vaid.rs:261-296`).

### 3.3 The precise line

> The builder authors **STRUCTURE and BOUNDS**; the substrate automatically mints **IDENTITY** and
> **ENFORCES** the bounds. There is **one** composition surface (roles + delegation + protocols).
> Governance identity/PoP/attenuation are **not fields in it** — they are what *happens to* every
> role when provisioned.

A subtlety that makes "ambient" exact: governance splits across the line.
- The scope/capability **values** are *authored* (the builder types the prefixes/grants).
- The minting, PoP, attenuation **mechanism** is *ambient* (no switch exists to disable it).

So even a builder who sets nothing still gets, for every role: a minted identity, a place in the
tree, an attenuated scope, and the over-envelope denial. The builder can change *what the scope is*;
they can never turn *off* the substrate.

### 3.4 What the builder sees vs what just happens

| The builder SEES (authors) | What just HAPPENS (ambient) |
|---|---|
| Role cards; "make root"; "delegated by" | A VAID is minted per role with a real Ed25519 key |
| Scope prefix + capability grants per role | Those become signed `scope_boundary`/`capability_set` on the VAID |
| The delegation tree (MAY-spawn edges) | Each edge becomes enforced `parent_vaid` lineage; cross-tenant/multi-parent denied |
| The protocol catalog + per-role config (§4) | `protocolConfig` ships to the agent's runtime, read by nothing else |
| "Provision" | Operator dual-signs the root; over-envelope child spawns are denied fail-closed |

The right-hand column is never a form. It is the substrate, on by default, for everyone.

---

## 4. The protocol surface as primary — the wiring

Goal: protocols become a **rich first-class per-role choice**, while `protocolConfig` flows through
as **opaque detail** into the spec and into the deployed agent — read by runtime, never by
governance.

### 4.1 The wiring (design, no code)

1. **Add `protocolConfig` to `ComposerRole`** (currently absent,
   `system-composer.store.ts:26-34`): `protocolConfig: Record<string, Record<string, unknown>>`
   (per-protocol config maps), plus the role's selected protocol ids.
2. **Repurpose the orphaned protocol components per role.** `ProtocolSelector`/`ProtocolConfigurator`
   today write to a single global legacy store (`useAppStore.builder.protocolConfigs`,
   `ProtocolSelector.tsx:24-25`, `ProtocolConfigurator.tsx:17-18`). Rewire them to read/write
   **`ComposerRole.protocolConfig` keyed by role ref** — each role owns its own protocol selection
   and config.
3. **Mount the catalog + selector + configurator inside the composer**, attached per `RoleCard`
   (`SystemComposerPage.tsx:26-101`). The 10-protocol catalog (`src/infrastructure/data/protocols.index.ts`,
   the per-protocol `*.spec.ts`) is the menu. The Protocol Explorer
   (`ProtocolExplorerPage.tsx`) remains the browse/documentation view and can deep-link into the
   per-role attach.
4. **`composerToSpec` must carry it through** (`system-composer.store.ts:152-170`): add
   `protocolConfig: r.protocolConfig` to the emitted `AgentRole`. This is the one-line flow that is
   currently missing.
5. **Flow end-to-end:**
   `ComposerRole.protocolConfig` → `AgentRole.protocolConfig` (`governed-system-spec.ts:33`) →
   Pydantic `protocol_config: dict[str, Any]` (`governed_system_spec.py:80`) → injected into the
   deployed agent's runtime config at deploy → read by the **agent's runtime behavior** → **never**
   by validator/provisioner/substrate (§2.3).

### 4.2 Primacy in the layout

Protocols should be the **largest, richest** region of each role — the catalog of MCP/A2A/AP2/ADK/…
is where the builder spends time. Scope/caps are a **small, templated governance strip**. SYNTHERA
is **not** an entry in this catalog; it is the substrate that wraps whatever is selected.

### 4.3 Wiring constraints (enforce the invariant)

- `protocolConfig` is the **only** sink for protocol choices. Selecting a protocol must **not**
  auto-populate `scopeBoundary` or `capabilitySet` (forbids LEAK-2).
- The existing compose-time validator already ignores `protocolConfig`
  (`governed-system-spec.validator.ts:57-162`); keep it that way — protocol detail is never a
  validation input.
- Reuse the existing opaque carrier shape: `generateConfig()` already emits exactly the per-protocol
  map (`config-generator.service.ts:20-41`) the spec wants; the composer's per-role config should
  produce the same `{ "<protocolId>": { version, ...config } }` shape.

---

## 5. The demo's "SYNTHERA under everything" proof

The thing to make visible: **pick any protocols you like on a role, and watch SYNTHERA still mint the
identity, still place it in the delegation tree, still attenuate its scope, and still DENY an
over-envelope spawn — regardless of protocol choice.** The governance holding *no matter what's on
top* is the proof.

### 5.1 Two panels, side by side

- **"Protocol layer — you choose"** (volatile): the per-role catalog + configurator (§4). As the
  builder toggles MCP, A2A, AP2, ADK, …, this panel changes constantly. `protocolConfig` fills with
  rich detail.
- **"SYNTHERA substrate — automatic"** (invariant): a live readout of the four governance outcomes
  for the selected role:
  1. ✓ **Identity minted** — `rootVaidId` (`forge-provisioning-builder.service.ts:30`).
  2. ✓ **Placed in the tree** — under `tenantId` / parent (`:31`, `permittedChildren` `:33`).
  3. ✓ **Scope attenuated** — child `scopeBoundary` ⊆ parent, shown on `permittedChildren`.
  4. ✓ **Over-envelope spawn DENIED** — see §5.3.

### 5.2 The invariance, made literal

The proof is **invariance under protocol change.** Re-provision the same role twice with *completely
different* protocol sets (or none at all). The emitted `GovernedSystemSpec`'s **governed fields are
byte-for-byte identical**; only `protocolConfig` differs. Design the UI to show this directly:

- Render the emitted spec JSON with **governed fields (G) highlighted stable** and `protocolConfig`
  **highlighted changing**.
- An explicit **"governance unaffected by protocol choice"** indicator that diffs the two
  provisions: G-diff = ∅, P-diff = (whatever the builder changed). The empty G-diff *is* the
  orthogonality, on screen.

The "SYNTHERA substrate" panel **does not move** as the builder clicks protocols. That non-movement,
next to the volatile protocol panel, is the demo.

### 5.3 The denial, shown live

The over-envelope denial already exists in the proven-live path: the deployed agent's
`_spawn_worker` runs a **bypass probe** that tries to `mint_child` with a scope *escaping its own*
(`forge-agents/templates/agent/base/synthera_agent/main.py:155-158`,
`scope_boundary=["data.secret"]`), and the substrate **denies** it
(`mint_vaid.rs:231-236`: *"child scope_boundary exceeds the parent's — least-privilege attenuation
denied"*). Surface that real substrate rejection verbatim in the demo: a red **"DENIED by SYNTHERA:
over-envelope spawn"** with the substrate's own message. Then change the role's protocols and run it
again — the denial is **identical**, because the denial reads scope, not protocols.

### 5.4 What the user concludes

Protocols changed everything *above*; governance below did not move; the over-envelope spawn was
denied either way. SYNTHERA is under everything, and it is not optional.

---

## 6. Open decisions — for your ruling (not resolved here)

- **D-A — the ambient line tradeoff (invisible-trust vs builder-control).** How visible should the
  *authored* scope/caps be? (A) Keep the current visible "Governance" strip under the Shield header
  (`SystemComposerPage.tsx:191`) — full control, but reads like a second form. (B) Auto-template and
  collapse behind an "advanced" disclosure so the default builder never touches scope/caps —
  maximally ambient, less control. (C) Show scope/caps as read-only **derived chips** (templated from
  tenant+ref+role) with an explicit "customize" opt-in. *This is the core "ambient" tradeoff.*

- **D-B — LEAK-1 (`agent-to-spec.ts:40`, UI tags → governance caps).** (A) Deprecate/remove the
  single-agent bridge entirely — the composer is now the primary surface and `App.tsx:16` already
  routes `builder` → composer, so the bridge may be dead weight. (B) Keep it but source
  `capabilitySet` from a deliberate governance field and treat `agent.capabilities` strictly as
  non-governed tags. *Touches whether the legacy single-agent path survives at all.*

- **D-C — LEAK-2 prevention (`protocol.types.ts:106`).** Confirm the **binding constraint** that
  selected protocols **never** auto-populate `capabilitySet` (recommended). Or permit a *suggestion*
  flow (protocol proposes caps; builder must explicitly accept into the governance field) — softer,
  but reintroduces leak risk if "accept" is implicit.

- **D-D — where protocols attach in the UI.** Per-role inside each `RoleCard` (heavier cards, clear
  per-identity binding, matches "protocols are primary") vs a separate protocols step/tab that
  references roles (lighter composer, but splits the primary surface). *Layout ruling.*

- **D-E — handoffs (runtime protocol messaging).** Currently stubbed ("None composed in this demo",
  `SystemComposerPage.tsx:211-214`); kept visibly distinct from delegation (D7). If protocols are
  now the primary surface, do A2A-style runtime handoffs become first-class authoring **now**, or
  stay deferred? *In-scope-now vs deferred ruling.*

- **D-F — single-source for M4 (item-1 instruction).** Confirm the split in §1: this doc owns the
  UX-primacy framing; the contract's M4 row keeps governance-opacity and gains a one-line pointer
  here (with the proposed replacement text in §1). Or fold the UX framing back into the contract.
  *Needed to avoid two divergent descriptions of the protocol layer.*

---

## Halt

Design recorded. No code, no scaffolding, no commits beyond this document. Awaiting your ruling on
§1's single-source split and the open decisions D-A…D-F. On approval, the buildable surface is: the
per-role protocol wiring (§4), the ambient-governance UI line (§3), the orthogonality leak fixes
(§2.4: LEAK-1, forbid LEAK-2/3), and the side-by-side invariance demo (§5).
