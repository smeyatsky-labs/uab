# Universal Agent Builder (UAB) — Governed Multi-Agent System Composer

UAB is the public-facing surface for composing **governed multi-agent systems** on
the SYNTHERA substrate, with **forge-agents** as the headless provisioning engine.
You compose *roles* and *permitted delegation* (a delegation **envelope**), and the
engine provisions identity-governed agents whose delegation is enforced by the
substrate and respected by the agents themselves.

This is a **demo / single-operator** build. Read "What this is NOT" before drawing
any conclusion about production readiness.

## What you can do

Compose a system in the UI (the **Governed System Composer**, the primary flow):

1. Define **roles** under one **tenant**, with one **root** (D1/D3).
2. Draw **permitted delegation** — "this supervisor MAY spawn workers of this kind,
   attenuated thus" — a single-parent tree. This is an **envelope**, not a fixed
   instance list (D5): the runtime populates instances within it.
3. Each role carries a **resource-prefix scope** (templated per role; the UI never
   implies action verbs, D4) and a **capability set**.
4. The composed spec is **validated live against the forge-agents-owned schema**
   (D6): illegal shapes (multi-parent, broader-than-parent scope, action-verb scope,
   cycle, cross-tenant, ...) are **rejected in the UI before they can be provisioned**.
5. **Provision** hands the validated `GovernedSystemSpec` to the real provisioning
   engine (`BuilderPort` → `ForgeProvisioningBuilderService`).

## End-to-end (the proven path)

```
compose in UAB ─► validate against schema ─► provision the root (operator mint)
   ─► deploy root to Cloud Run with the spec-derived envelope
   ─► root self-spawns SPEC-PERMITTED children at runtime (mint_child)
   ─► an over-envelope spawn is DENIED by the substrate (attenuation)
```

Live, rerunnable proofs (forge-agents repo):

- `harness/gate2_live_proof.py` — spec → operator mint → permitted spawn →
  over-envelope denial → parity (the schema's verdicts match the substrate). 11/11.
- `harness/partA_envelope_proof.py` — deploy a root with a spec-derived envelope;
  the agent's envelope == the spec, it self-spawns the permitted child, it **refuses
  an out-of-envelope role locally**, and a bypassed over-envelope spawn is still
  **denied substrate-side** (defense-in-depth). 4/4.
- UAB `src/infrastructure/contract/governed-system-spec.validator.test.ts` — the
  compose-time guard: one rejection test per illegal shape. 14/14.

Run the engine-side proofs:

```
python harness/gate2_live_proof.py \
  --substrate-url <SUBSTRATE_URL> \
  --kms-key-version <OPERATOR_KMS_KEY_VERSION>
```

Run the UI against the live engine by setting `VITE_FORGE_PROVISION_URL` (the
provisioning endpoint) and `VITE_FORGE_TENANT_ID`; unset, the builder falls back to
a mock so offline dev keeps working.

## What this IS

- Compose a **governed multi-agent system** (roles + permitted delegation envelope).
- **Real provisioning** via forge-agents: the operator-mediated mint of the system
  root over the live substrate.
- **Identity-governed agents**: each agent holds its own VAID and acts under its own
  proof-of-possession.
- **Attenuated delegation** that is **both substrate-enforced and agent-respected**:
  the substrate denies any child exceeding its parent's scope/capabilities, and the
  deployed agent spawns only children within its injected envelope.
- **Single demo-operator posture**: one platform/test operator mints the roots.

## What this is NOT (do not imply any of these)

- **Not public self-serve.** There is no per-user onboarding.
- **No per-user sovereign key custody.** Roots are minted by a single demo operator,
  not by each user's own sovereign operator identity. (Phase-2.)
- **No multi-tenant isolation / federation.** One tenant per system; cross-tenant
  delegation is denied by design. (Phase-3.)
- **No action-level policy governance.** Scope is **resource-prefix only**; the live
  substrate's policy engine is degraded and the default verdict is **Allow**. The
  governance proven here is **identity + delegation lineage + least-privilege
  attenuation**, not action governance. (Phase-2.)
- **No durable revocation / audit-of-record.** The substrate ledger is ephemeral.
  (Phase-2.)
- **Browser → provisioning-endpoint round trip is not stood up.** The UI composes and
  validates the spec and the engine provisions it; the HTTP service that joins them
  (wrapping the operator mint, with its own auth decision) is the remaining
  integration seam.

## Development

```
npm install
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build
npm run lint       # eslint
npm run test       # vitest (compose-time validator tests)
```

## Live demo resources (for teardown)

Provisioning + deploy create live cloud resources under the demo GCP project. To
remove a deployed demo agent and its identity secrets:

```
gcloud run services delete forge-agent-<tenant> --region us-central1
gcloud secrets delete <tenant>-vaid
gcloud secrets delete <tenant>-seed
```

Ephemeral demo VAIDs minted during proofs live on the substrate and are not durably
persisted (the ledger is ephemeral).
