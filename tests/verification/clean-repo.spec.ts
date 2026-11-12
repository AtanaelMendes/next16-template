import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe('Scenario 10: Zero Remaining References to Axios and amCharts', () => {
  const BANNED_PACKAGES = [
    'axios',
    '@amcharts/amcharts5',
    '@amcharts/amcharts5-geodata',
  ];

  const BANNED_PATTERNS = [
    /axios/i,
    /amcharts/i,
    /\bam5([a-zA-Z0-9_]*|\b)/i,
  ];

  test('package.json contains no banned dependencies', () => {
    const pkgPath = path.resolve('package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDependencies = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
      ...pkg.optionalDependencies,
    };

    for (const pkgName of BANNED_PACKAGES) {
      expect(
        allDependencies[pkgName],
        `package.json should not contain "${pkgName}"`
      ).toBeUndefined();
    }
  });

  test('package-lock.json contains no banned dependencies', () => {
    const lockPath = path.resolve('package-lock.json');
    expect(fs.existsSync(lockPath), 'package-lock.json must exist').toBe(true);

    const lockContent = fs.readFileSync(lockPath, 'utf-8');
    const lock = JSON.parse(lockContent);

    // Scan all keys in lock.packages (including direct, nested, and transitive dependencies)
    if (lock.packages) {
      const packageKeys = Object.keys(lock.packages);
      for (const pkgName of BANNED_PACKAGES) {
        const matches = packageKeys.filter(
          (key) => key.endsWith(`node_modules/${pkgName}`) || key.includes(`/node_modules/${pkgName}`)
        );
        expect(
          matches,
          `package-lock.json packages should not contain "${pkgName}" (matched keys: ${matches.join(', ')})`
        ).toEqual([]);

        // Verify root package dependencies in packages['']
        if (lock.packages['']?.dependencies) {
          expect(
            lock.packages[''].dependencies[pkgName],
            `package-lock.json packages[""].dependencies should not contain "${pkgName}"`
          ).toBeUndefined();
        }
      }
    }

    // Check top-level legacy dependencies map if present (npm lockfile v1/v2 compatibility)
    if (lock.dependencies) {
      for (const pkgName of BANNED_PACKAGES) {
        expect(
          lock.dependencies[pkgName],
          `package-lock.json top-level dependencies should not contain "${pkgName}"`
        ).toBeUndefined();
      }
    }
  });

  test('legacy files src/plugins/axios.js and orphaned chart files do not exist', () => {
    const legacyAxiosPlugin = path.resolve('src/plugins/axios.js');
    expect(
      fs.existsSync(legacyAxiosPlugin),
      'src/plugins/axios.js must be deleted'
    ).toBe(false);

    const orphanChart = path.resolve('src/components/ui/charts/exemploXY.js');
    expect(
      fs.existsSync(orphanChart),
      'src/components/ui/charts/exemploXY.js must be deleted'
    ).toBe(false);
  });

  test('src/ directory contains zero references to axios or amcharts', () => {
    const srcDir = path.resolve('src');
    expect(fs.existsSync(srcDir)).toBe(true);

    function walkDir(dir: string): string[] {
      let results: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(walkDir(fullPath));
        } else if (/\.(jsx?|tsx?|mjs|css|json)$/.test(entry.name)) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const files = walkDir(srcDir);
    const violations: { file: string; line: number; content: string; matchedPattern: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const pattern of BANNED_PATTERNS) {
          if (pattern.test(line)) {
            violations.push({
              file: path.relative(process.cwd(), file),
              line: index + 1,
              content: line.trim(),
              matchedPattern: pattern.toString(),
            });
            break; // Record once per line
          }
        }
      });
    }

    if (violations.length > 0) {
      const summary = violations
        .map((v) => `  ${v.file}:${v.line} -> ${v.content} (matched ${v.matchedPattern})`)
        .join('\n');
      expect(
        violations,
        `Found ${violations.length} banned legacy reference(s) in src/:\n${summary}`
      ).toEqual([]);
    } else {
      expect(violations).toEqual([]);
    }
  });
});
