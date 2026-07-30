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

- [low] Exactly how is a skill's SKILL.md content injected into the model's prompt -- fully upfront, or lazily via a tool call the model issues?
  Likely: N/A -- resolved with direct evidence.
- [low] How does model-selection of a skill work when disableModelInvocation is false -- is it description-based (model reads a catalog and chooses), rule-based, or route-based?
  Likely: N/A -- resolved with direct evidence.

