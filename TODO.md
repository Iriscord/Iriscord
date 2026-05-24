- [ ] Update git updater IPC handlers in `src/main/updater/git.ts`:
  - [ ] Make GET_UPDATES return [] (no updates) unless remote HEAD differs from local HEAD.
  - [ ] Make UPDATE spawn PowerShell and run `irm https://github.com/Iriscord/Iriscord/raw/main/scripts/bootstrap.ps1 | iex`.
  - [ ] Preserve existing build/repo behavior and error serialization.
- [ ] Run typecheck/lint/tests (as available) to ensure updater compiles.
- [ ] Manually verify updater UX:
  - [ ] No updates shown by default.
  - [ ] After making repo changes, update prompt appears.
  - [ ] Clicking update triggers PowerShell and follows manual/auto flow handled by bootstrap script.

