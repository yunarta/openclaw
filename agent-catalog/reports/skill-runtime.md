# Skill Runtime

## Skills

**Status:** confirmed  **Category:** skills  **Maturity:** production

Markdown-based (SKILL.md) reusable agent skills with declarative frontmatter metadata, discovered from a bundled skills/ directory (~53 entries confirmed) plus workspace-local sources, with invocation policy (userInvocable/disableModelInvocation) and a proposal-based workshop for authoring changes.

> See the skill-runtime module and skillDataTypes/seedSkills records.

## Cataloged skills (sample, per `skill_map` view)

- **diagram-maker** (confirmed) -- `skills/diagram-maker/SKILL.md` -- Bundled skill directory confirmed to exist under skills/diagram-maker/SKILL.md.
- **summarize** (confirmed) -- `skills/summarize/SKILL.md` -- Bundled skill directory confirmed to exist under skills/summarize/SKILL.md.
- **video-frames** (confirmed) -- `skills/video-frames/SKILL.md` -- Bundled skill directory confirmed to exist under skills/video-frames/SKILL.md.

## Open questions

- [high] Exactly how is a skill's SKILL.md content injected into the model's prompt -- fully upfront, or lazily via a tool call the model issues?
  Likely: Likely a hybrid: a short skill index/description is always in context (for model-selection), with the full SKILL.md body fetched on demand via a tool when the skill is actually invoked -- consistent with the 'Skill' tool pattern referenced in root AGENTS.md ('Skills own workflows').
- [medium] How does model-selection of a skill work when disableModelInvocation is false -- is it description-based (model reads a catalog and chooses), rule-based, or route-based?
  Likely: Likely description-based: a compact per-skill description is included in the system prompt or a dedicated Skill tool's own description, and the model chooses by issuing a tool call naming the skill.

