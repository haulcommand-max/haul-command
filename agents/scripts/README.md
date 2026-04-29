# Haul Command Hybrid Super-Scripts

These scripts are the worker/process side of the hybrid Paperclip command fabric.

Architecture:

- 7 real super agents / execution owners
- 208 virtual mandates routed as task scopes
- Supabase command layer tracks tasks, runs, proof packets, approvals, and money events
- LLMs are escalation-only; workers handle bulk loops

Required rule:

Every production super-script must report into the command layer using `CommandHeartbeat` or direct Supabase `hc_command_runs` writes.

Current source of truth:

- `agents/config/hybrid-command-fabric.json`
- `agents/hybrid-paperclip-provision.js`
- `scripts/command-fabric-audit.mjs`
