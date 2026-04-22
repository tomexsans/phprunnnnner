# Flathub Submission Guide

## Before you submit

### 1. Tag a release on GitHub
```bash
git tag v0.1.0
git push origin v0.1.0
```

### 2. Generate the npm sources file
Flatpak builds have no internet access, so all packages must be pre-declared.
Run this from the project root (not inside flatpak/):
```bash
pip install --upgrade flatpak-node-generator
rm -rf node_modules && flatpak-node-generator npm package-lock.json -o flatpak/generated-sources.json
```
This must be re-run every time package-lock.json changes.

### 3. Install Flatpak build tools (one-time setup)
```bash
sudo apt install flatpak flatpak-builder
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
flatpak install flathub org.freedesktop.Platform//25.08 org.freedesktop.Sdk//25.08
flatpak install flathub org.electronjs.Electron2.BaseApp//25.08
flatpak install flathub org.freedesktop.Sdk.Extension.node20//25.08
```

### 4. Test the build locally
From inside the `flatpak/` directory:
```bash
flatpak-builder --force-clean --user --install build-dir io.github.tomexsans.PHPRunnnnner.yml
flatpak run io.github.tomexsans.PHPRunnnnner
```

### 5. Validate the metainfo
```bash
flatpak run --command=appstream-util org.freedesktop.Sdk//24.08 \
  validate io.github.tomexsans.PHPRunnnnner.metainfo.xml
```

---

## Submitting to Flathub

1. Go to https://github.com/flathub/flathub and **fork** the repo
2. Create a new branch: `new-app-io.github.tomexsans.PHPRunnnnner`
3. Add a folder `io.github.tomexsans.PHPRunnnnner/` containing:
   - `io.github.tomexsans.PHPRunnnnner.yml`
   - `io.github.tomexsans.PHPRunnnnner.desktop`
   - `io.github.tomexsans.PHPRunnnnner.metainfo.xml`
   - `generated-sources.json`
4. Open a Pull Request to `flathub/flathub` — title: `Add io.github.tomexsans.PHPRunnnnner`
5. A Flathub reviewer will check your submission (usually takes a few days to weeks)

---

## Notes

- `--filesystem=home` is granted so PHP code using `file_put_contents()` can write to the user's home directory
- `--no-sandbox` is required in the wrapper script because Electron's sandbox conflicts with Flatpak's own sandboxing
- Update the `releases` section in the metainfo each time you publish a new version
