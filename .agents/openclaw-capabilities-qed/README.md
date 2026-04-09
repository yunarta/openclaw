# OpenClaw Capabilities QED Registry

**Purpose:** Store research findings about OpenClaw capabilities as proof-of-function code and documentation.

**Format:** Each capability gets one markdown file with findings + one or more QED proof files.

---

## Capabilities Checked

### 1. **Recursive File Inclusion in System Prompt** ❌ NOT IMPLEMENTED
   - **Question:** Does OpenClaw recursively include files when it encounters "Read X.md" instructions in SOUL.md/AGENTS.md?
   - **Answer:** **NO**
   - **Evidence:** 
     - `src/agents/bootstrap-files.ts` loads bootstrap files from known locations
     - `src/agents/pi-embedded-helpers/bootstrap.ts::buildBootstrapContextFiles()` includes file content as-is
     - No directive parser for inline "Read X.md" instructions
   - **QED:** See `proofs/file-inclusion.qed.ts`

---

## Storage & Access

- Each capability as `.md` file with question + answer + evidence + links to QED
- QED proofs in `proofs/` with same name as capability file
- You can ask new questions anytime; I'll search, document, and commit findings
