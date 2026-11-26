// Xcode 26.4's clang rejects fmt 11.0.2's consteval usage (pinned by React Native 0.79).
// Injects a Podfile post_install step that disables consteval in fmt on Apple clang.
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '[fmt-xcode26-fix]';
const SNIPPET = `
    # ${MARKER} Xcode 26.4 clang rejects fmt 11.0.2's consteval usage; disable it on Apple clang.
    fmt_base = File.join(installer.sandbox.pod_dir('fmt'), 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      src = File.read(fmt_base)
      patched = src.sub('defined(__apple_build_version__) && __apple_build_version__ < 14000029L', 'defined(__apple_build_version__)')
      if patched != src
        File.chmod(0644, fmt_base)
        File.write(fmt_base, patched)
      end
    end
`;

module.exports = function withFmtXcode26Fix(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');
      if (!contents.includes(MARKER)) {
        contents = contents.replace(/(post_install do \|installer\|\n)/, `$1${SNIPPET}\n`);
        fs.writeFileSync(podfile, contents);
      }
      return cfg;
    },
  ]);
};
