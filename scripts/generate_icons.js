import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tauriIconsDir = path.join(rootDir, 'src-tauri', 'icons');
const uiAssetsDir = path.join(rootDir, 'src', 'lib', 'assets');

const sources = {
  iconBlack: path.join(rootDir, 'only logo black.png'),
  iconWhite: path.join(rootDir, 'only logo white.png'),
  logoBlack: path.join(rootDir, 'dicta logo black.png'),
  logoWhite: path.join(rootDir, 'dicta logo white.png'),
};

const output = {
  appIcon: path.join(rootDir, 'app-icon.png'),
  favicon: path.join(rootDir, 'public', 'favicon.ico'),
  trayLight: path.join(tauriIconsDir, 'tray_light_32.png'),
  trayDark: path.join(tauriIconsDir, 'tray_dark_32.png'),
};

function assertSourceFiles() {
  for (const sourcePath of Object.values(sources)) {
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Missing logo source: ${path.relative(rootDir, sourcePath)}`);
    }
  }
}

async function createContainedMark(sourcePath, size, padding = 0) {
  const contentSize = size - padding * 2;
  const mark = await sharp(sourcePath)
    .trim()
    .resize(contentSize, contentSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function createAppIcon() {
  const whiteMark = await createContainedMark(sources.iconWhite, 320);
  const background = Buffer.from(`
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="112" fill="#0F172A"/>
    </svg>
  `);

  return sharp(background)
    .composite([{ input: whiteMark, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function generate() {
  assertSourceFiles();
  fs.mkdirSync(tauriIconsDir, { recursive: true });
  fs.mkdirSync(uiAssetsDir, { recursive: true });

  fs.copyFileSync(sources.iconBlack, path.join(uiAssetsDir, 'only-logo-black.png'));
  fs.copyFileSync(sources.iconWhite, path.join(uiAssetsDir, 'only-logo-white.png'));
  fs.copyFileSync(sources.logoBlack, path.join(uiAssetsDir, 'dicta-logo-black.png'));
  fs.copyFileSync(sources.logoWhite, path.join(uiAssetsDir, 'dicta-logo-white.png'));

  const appIcon = await createAppIcon();
  fs.writeFileSync(output.appIcon, appIcon);

  const tauriCli = path.join(rootDir, 'node_modules', '@tauri-apps', 'cli', 'tauri.js');
  execFileSync(process.execPath, [tauriCli, 'icon', output.appIcon, '--output', tauriIconsDir], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  fs.writeFileSync(output.trayLight, await createContainedMark(sources.iconBlack, 32, 4));
  fs.writeFileSync(output.trayDark, await createContainedMark(sources.iconWhite, 32, 4));
  fs.writeFileSync(path.join(tauriIconsDir, 'tray_light_16.png'), await createContainedMark(sources.iconBlack, 16, 2));
  fs.writeFileSync(path.join(tauriIconsDir, 'tray_dark_16.png'), await createContainedMark(sources.iconWhite, 16, 2));

  fs.writeFileSync(output.favicon, await pngToIco(output.appIcon));
  console.log('Generated UI assets, platform icons, favicon, and light/dark tray icons.');
}

generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
